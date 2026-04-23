package callsession

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/cauco/trust-platform/backend/internal/auditlog"
	"github.com/cauco/trust-platform/backend/internal/phone"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db        *pgxpool.Pool
	auditRepo *auditlog.Repository
}

func NewRepository(db *pgxpool.Pool, auditRepo *auditlog.Repository) *Repository {
	return &Repository{
		db:        db,
		auditRepo: auditRepo,
	}
}

const duplicateWindowSeconds = 1

func (r *Repository) Create(ctx context.Context, req CreateCallSessionRequest) (CallSession, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return CallSession{}, err
	}
	defer tx.Rollback(ctx)

	var item CallSession
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err = tx.QueryRow(ctx, `
		INSERT INTO call_sessions (phone_number, company_id, verified_number_id, call_reason_id, risk_level, trust_score)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, phone_number, company_id, verified_number_id, call_reason_id, risk_level, trust_score, created_at
	`, normalizedPhone, req.CompanyID, req.VerifiedNumberID, req.CallReasonID, req.RiskLevel, req.TrustScore).Scan(
		&item.ID,
		&item.PhoneNumber,
		&item.CompanyID,
		&item.VerifiedNumberID,
		&item.CallReasonID,
		&item.RiskLevel,
		&item.TrustScore,
		&item.CreatedAt,
	)
	if err != nil {
		return CallSession{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "call_session_created",
			ResourceType: "call_session",
			ResourceID:   item.ID,
			Message:      fmt.Sprintf("Call session %d created for %s.", item.ID, item.PhoneNumber),
		})
		if err != nil {
			return CallSession{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CallSession{}, err
	}

	return item, nil
}

func (r *Repository) CreateIfNotRecentDuplicate(ctx context.Context, req CreateCallSessionRequest) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	normalizedPhone := phone.Normalize(req.PhoneNumber)

	var latestCreatedAt time.Time
	err := r.db.QueryRow(ctx, `
		SELECT created_at
		FROM call_sessions
		WHERE phone_number = $1
		  AND company_id IS NOT DISTINCT FROM $2
		  AND verified_number_id IS NOT DISTINCT FROM $3
		  AND call_reason_id IS NOT DISTINCT FROM $4
		  AND risk_level = $5
		  AND trust_score = $6
		ORDER BY created_at DESC
		LIMIT 1
	`, normalizedPhone, req.CompanyID, req.VerifiedNumberID, req.CallReasonID, req.RiskLevel, req.TrustScore).Scan(&latestCreatedAt)

	if err != nil && err != pgx.ErrNoRows {
		return false, err
	}

	if err == nil && time.Since(latestCreatedAt) <= duplicateWindowSeconds*time.Second {
		return false, nil
	}

	_, err = r.Create(ctx, req)
	if err != nil {
		return false, err
	}

	return true, nil
}

func (r *Repository) List(ctx context.Context) ([]CallSession, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx, `
		SELECT
			cs.id,
			cs.phone_number,
			cs.company_id,
			c.name,
			cs.verified_number_id,
			vn.phone_number,
			vn.label,
			cs.call_reason_id,
			cr.title,
			cs.risk_level,
			cs.trust_score,
			cs.created_at
		FROM call_sessions cs
		LEFT JOIN companies c ON c.id = cs.company_id
		LEFT JOIN verified_numbers vn ON vn.id = cs.verified_number_id
		LEFT JOIN call_reasons cr ON cr.id = cs.call_reason_id
		ORDER BY created_at DESC, id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CallSession, 0)

	for rows.Next() {
		var item CallSession
		var companyName sql.NullString
		var verifiedNumberPhone sql.NullString
		var verifiedNumberLabel sql.NullString
		var callReasonTitle sql.NullString
		err := rows.Scan(
			&item.ID,
			&item.PhoneNumber,
			&item.CompanyID,
			&companyName,
			&item.VerifiedNumberID,
			&verifiedNumberPhone,
			&verifiedNumberLabel,
			&item.CallReasonID,
			&callReasonTitle,
			&item.RiskLevel,
			&item.TrustScore,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if companyName.Valid {
			item.CompanyName = companyName.String
		}
		if verifiedNumberPhone.Valid {
			item.VerifiedNumberPhone = verifiedNumberPhone.String
		}
		if verifiedNumberLabel.Valid {
			item.VerifiedNumberLabel = verifiedNumberLabel.String
		}
		if callReasonTitle.Valid {
			item.CallReasonTitle = callReasonTitle.String
		}
		items = append(items, item)
	}

	return items, rows.Err()
}
