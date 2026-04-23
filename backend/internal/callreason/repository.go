package callreason

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Repository struct {
	db *pgx.Conn
}

func NewRepository(db *pgx.Conn) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, req CreateCallReasonRequest) (CallReason, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			return CallReason{}, err
		}
		expiresAt = &parsed
	}

	priority := req.Priority
	if priority == "" {
		priority = "normal"
	}

	var cr CallReason

	err := r.db.QueryRow(ctx, `
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

	return cr, err
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
