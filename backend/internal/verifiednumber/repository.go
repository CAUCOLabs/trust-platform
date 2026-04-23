package verifiednumber

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/cauco/trust-platform/backend/internal/auditlog"
	"github.com/cauco/trust-platform/backend/internal/callsession"
	"github.com/cauco/trust-platform/backend/internal/phone"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db              *pgxpool.Pool
	auditRepo       *auditlog.Repository
	callSessionRepo *callsession.Repository
}

func NewRepository(db *pgxpool.Pool, auditRepo *auditlog.Repository, callSessionRepo *callsession.Repository) *Repository {
	return &Repository{
		db:              db,
		auditRepo:       auditRepo,
		callSessionRepo: callSessionRepo,
	}
}

func (r *Repository) Create(ctx context.Context, req CreateVerifiedNumberRequest) (VerifiedNumber, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return VerifiedNumber{}, err
	}
	defer tx.Rollback(ctx)

	var vn VerifiedNumber
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err = tx.QueryRow(ctx, `
		INSERT INTO verified_numbers (company_id, phone_number, label)
		VALUES ($1, $2, $3)
		RETURNING id, company_id, phone_number, label, verified, created_at
	`, req.CompanyID, normalizedPhone, req.Label).Scan(
		&vn.ID,
		&vn.CompanyID,
		&vn.PhoneNumber,
		&vn.Label,
		&vn.Verified,
		&vn.CreatedAt,
	)
	if err != nil {
		return VerifiedNumber{}, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO number_signals (verified_number_id, spam_reports, lookup_count, trust_score, updated_at)
		VALUES ($1, 0, 0, 100, NOW())
		ON CONFLICT (verified_number_id) DO NOTHING
	`, vn.ID)
	if err != nil {
		return VerifiedNumber{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "verified_number_created",
			ResourceType: "verified_number",
			ResourceID:   vn.ID,
			Message:      fmt.Sprintf("Verified number %s created.", vn.PhoneNumber),
		})
		if err != nil {
			return VerifiedNumber{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return VerifiedNumber{}, err
	}

	return vn, nil
}

func (r *Repository) Update(ctx context.Context, id int64, req UpdateVerifiedNumberRequest) (VerifiedNumber, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return VerifiedNumber{}, err
	}
	defer tx.Rollback(ctx)

	var vn VerifiedNumber
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err = tx.QueryRow(ctx, `
		UPDATE verified_numbers
		SET
			company_id = $2,
			phone_number = $3,
			label = $4
		WHERE id = $1
		RETURNING id, company_id, phone_number, label, verified, created_at
	`, id, req.CompanyID, normalizedPhone, req.Label).Scan(
		&vn.ID,
		&vn.CompanyID,
		&vn.PhoneNumber,
		&vn.Label,
		&vn.Verified,
		&vn.CreatedAt,
	)
	if err != nil {
		return VerifiedNumber{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "verified_number_updated",
			ResourceType: "verified_number",
			ResourceID:   vn.ID,
			Message:      fmt.Sprintf("Verified number %s updated.", vn.PhoneNumber),
		})
		if err != nil {
			return VerifiedNumber{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return VerifiedNumber{}, err
	}

	return vn, nil
}

func (r *Repository) List(ctx context.Context) ([]VerifiedNumber, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, phone_number, label, verified, created_at
		FROM verified_numbers
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]VerifiedNumber, 0)

	for rows.Next() {
		var vn VerifiedNumber
		err := rows.Scan(
			&vn.ID,
			&vn.CompanyID,
			&vn.PhoneNumber,
			&vn.Label,
			&vn.Verified,
			&vn.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, vn)
	}

	return items, rows.Err()
}

func (r *Repository) LookupByPhoneNumber(ctx context.Context, phoneNumber string) (LookupResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	normalizedPhone := phone.Normalize(phoneNumber)

	var res LookupResponse
	var verifiedNumberID int64
	var callReasonID sql.NullInt64
	var reasonTitle sql.NullString
	var reasonDescription sql.NullString
	var reasonPriority sql.NullString
	var reasonExpiresAt sql.NullTime
	var lastSeenAt sql.NullTime

	err := r.db.QueryRow(ctx, `
		SELECT
			vn.id,
			vn.phone_number,
			vn.company_id,
			c.name,
			vn.label,
			vn.verified,
			COALESCE(ns.spam_reports, 0),
			COALESCE(ns.lookup_count, 0),
			ns.last_seen_at,
			COALESCE(ns.trust_score, 100),
			cr.id,
			cr.title,
			cr.description,
			cr.priority,
			cr.expires_at
		FROM verified_numbers vn
		INNER JOIN companies c ON c.id = vn.company_id
		LEFT JOIN number_signals ns ON ns.verified_number_id = vn.id
		LEFT JOIN call_reasons cr
			ON cr.company_id = c.id
			AND cr.active = TRUE
			AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
		WHERE vn.phone_number = $1
		ORDER BY cr.id DESC
		LIMIT 1
	`, normalizedPhone).Scan(
		&verifiedNumberID,
		&res.PhoneNumber,
		&res.CompanyID,
		&res.CompanyName,
		&res.Label,
		&res.Verified,
		&res.SpamReports,
		&res.LookupCount,
		&lastSeenAt,
		&res.TrustScore,
		&callReasonID,
		&reasonTitle,
		&reasonDescription,
		&reasonPriority,
		&reasonExpiresAt,
	)

	if err == pgx.ErrNoRows {
		return LookupResponse{
			Found:       false,
			PhoneNumber: normalizedPhone,
			Verified:    false,
		}, nil
	}

	if err != nil {
		return LookupResponse{}, err
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO number_signals (verified_number_id, spam_reports, lookup_count, last_seen_at, trust_score, updated_at)
		VALUES ($1, 0, 1, NOW(), 100, NOW())
		ON CONFLICT (verified_number_id)
		DO UPDATE SET
			lookup_count = number_signals.lookup_count + 1,
			last_seen_at = NOW(),
			updated_at = NOW()
	`, verifiedNumberID)
	if err != nil {
		return LookupResponse{}, err
	}

	res.Found = true
	res.VerifiedNumberID = verifiedNumberID
	res.LookupCount = res.LookupCount + 1
	res.LastSeenAt = timePtrNow()

	if callReasonID.Valid {
		res.CallReasonID = &callReasonID.Int64
	}

	if reasonTitle.Valid && reasonDescription.Valid && reasonPriority.Valid {
		var expiresAt *time.Time
		if reasonExpiresAt.Valid {
			expiresAt = &reasonExpiresAt.Time
		}

		res.CallReason = &LookupCallReason{
			Title:       reasonTitle.String,
			Description: reasonDescription.String,
			Priority:    reasonPriority.String,
			ExpiresAt:   expiresAt,
		}
	}

	if r.callSessionRepo != nil {
		inserted, insertErr := r.callSessionRepo.CreateIfNotRecentDuplicate(ctx, callsession.CreateCallSessionRequest{
			PhoneNumber:      res.PhoneNumber,
			CompanyID:        int64Ptr(res.CompanyID),
			VerifiedNumberID: &verifiedNumberID,
			CallReasonID:     res.CallReasonID,
			RiskLevel:        riskLevelFromScore(res.TrustScore, res.SpamReports, res.Verified),
			TrustScore:       res.TrustScore,
		})
		if insertErr != nil {
			log.Printf("call session insert failed for phone_number=%q verified_number_id=%d: %v", res.PhoneNumber, verifiedNumberID, insertErr)
			return LookupResponse{}, insertErr
		}
		if inserted {
			log.Printf("call session created for phone_number=%q verified_number_id=%d", res.PhoneNumber, verifiedNumberID)
		} else {
			log.Printf("call session deduped for phone_number=%q verified_number_id=%d", res.PhoneNumber, verifiedNumberID)
		}
	} else {
		log.Printf("call session repo not configured for phone_number=%q verified_number_id=%d", res.PhoneNumber, verifiedNumberID)
	}

	return res, nil
}

func (r *Repository) ReportSpam(ctx context.Context, phoneNumber string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	normalizedPhone := phone.Normalize(phoneNumber)

	_, err := r.db.Exec(ctx, `
		UPDATE number_signals ns
		SET
			spam_reports = ns.spam_reports + 1,
			trust_score = GREATEST(0, ns.trust_score - 20),
			updated_at = NOW()
		FROM verified_numbers vn
		WHERE ns.verified_number_id = vn.id
		  AND vn.phone_number = $1
	`, normalizedPhone)

	return err
}

func (r *Repository) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	commandTag, err := tx.Exec(ctx, `
		DELETE FROM verified_numbers
		WHERE id = $1
	`, id)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "verified_number_deleted",
			ResourceType: "verified_number",
			ResourceID:   id,
			Message:      fmt.Sprintf("Verified number %d deleted.", id),
		})
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func timePtrNow() *time.Time {
	now := time.Now()
	return &now
}

func int64Ptr(value int64) *int64 {
	if value == 0 {
		return nil
	}

	return &value
}

func riskLevelFromScore(score int, spamReports int, verified bool) string {
	if !verified {
		return "high"
	}

	if spamReports >= 3 || score < 50 {
		return "high"
	}

	if spamReports >= 1 || score < 90 {
		return "medium"
	}

	return "low"
}
