package callreason

import (
	"context"
	"fmt"
	"time"

	"github.com/cauco/trust-platform/backend/internal/auditlog"
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

func (r *Repository) Create(ctx context.Context, req CreateCallReasonRequest) (CallReason, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return CallReason{}, err
	}
	defer tx.Rollback(ctx)

	expiresAt, priority, err := normalizeWriteRequest(req.ExpiresAt, req.Priority)
	if err != nil {
		return CallReason{}, err
	}

	var cr CallReason

	err = tx.QueryRow(ctx, `
		INSERT INTO call_reasons (company_id, title, description, priority, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, company_id, title, description, active, priority, expires_at, created_at
	`, req.CompanyID, req.Title, req.Description, priority, expiresAt).Scan(
		&cr.ID,
		&cr.CompanyID,
		&cr.Title,
		&cr.Description,
		&cr.Active,
		&cr.Priority,
		&cr.ExpiresAt,
		&cr.CreatedAt,
	)
	if err != nil {
		return CallReason{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "call_reason_created",
			ResourceType: "call_reason",
			ResourceID:   cr.ID,
			Message:      fmt.Sprintf("Call reason %s created.", cr.Title),
		})
		if err != nil {
			return CallReason{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CallReason{}, err
	}

	return cr, nil
}

func (r *Repository) Update(ctx context.Context, id int64, req UpdateCallReasonRequest) (CallReason, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return CallReason{}, err
	}
	defer tx.Rollback(ctx)

	expiresAt, priority, err := normalizeWriteRequest(req.ExpiresAt, req.Priority)
	if err != nil {
		return CallReason{}, err
	}

	var cr CallReason

	err = tx.QueryRow(ctx, `
		UPDATE call_reasons
		SET
			company_id = $2,
			title = $3,
			description = $4,
			priority = $5,
			expires_at = $6
		WHERE id = $1
		RETURNING id, company_id, title, description, active, priority, expires_at, created_at
	`, id, req.CompanyID, req.Title, req.Description, priority, expiresAt).Scan(
		&cr.ID,
		&cr.CompanyID,
		&cr.Title,
		&cr.Description,
		&cr.Active,
		&cr.Priority,
		&cr.ExpiresAt,
		&cr.CreatedAt,
	)
	if err != nil {
		return CallReason{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "call_reason_updated",
			ResourceType: "call_reason",
			ResourceID:   cr.ID,
			Message:      fmt.Sprintf("Call reason %s updated.", cr.Title),
		})
		if err != nil {
			return CallReason{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CallReason{}, err
	}

	return cr, nil
}

func (r *Repository) List(ctx context.Context) ([]CallReason, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, title, description, active, priority, expires_at, created_at
		FROM call_reasons
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CallReason, 0)

	for rows.Next() {
		var cr CallReason
		err := rows.Scan(
			&cr.ID,
			&cr.CompanyID,
			&cr.Title,
			&cr.Description,
			&cr.Active,
			&cr.Priority,
			&cr.ExpiresAt,
			&cr.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, cr)
	}

	return items, rows.Err()
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
		DELETE FROM call_reasons
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
			EventType:    "call_reason_deleted",
			ResourceType: "call_reason",
			ResourceID:   id,
			Message:      fmt.Sprintf("Call reason %d deleted.", id),
		})
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func normalizeWriteRequest(rawExpiresAt *string, rawPriority string) (*time.Time, string, error) {
	var expiresAt *time.Time
	if rawExpiresAt != nil && *rawExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *rawExpiresAt)
		if err != nil {
			return nil, "", err
		}
		expiresAt = &parsed
	}

	priority := rawPriority
	if priority == "" {
		priority = "normal"
	}

	return expiresAt, priority, nil
}
