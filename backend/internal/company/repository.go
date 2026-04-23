package company

import (
	"context"
	"time"

	"github.com/cauco/trust-platform/backend/internal/phone"
	"github.com/jackc/pgx/v5"
)

type Repository struct {
	db *pgx.Conn
}

func NewRepository(db *pgx.Conn) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, req CreateCompanyRequest) (Company, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var c Company
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err := r.db.QueryRow(ctx, `
		INSERT INTO companies (name, business_id, phone_number)
		VALUES ($1, $2, $3)
		RETURNING id, name, business_id, phone_number, verified, created_at, updated_at
	`, req.Name, req.BusinessID, normalizedPhone).Scan(
		&c.ID,
		&c.Name,
		&c.BusinessID,
		&c.PhoneNumber,
		&c.Verified,
		&c.CreatedAt,
		&c.UpdatedAt,
	)

	return c, err
}

func (r *Repository) List(ctx context.Context) ([]Company, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx, `
		SELECT id, name, business_id, phone_number, verified, created_at, updated_at
		FROM companies
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	companies := make([]Company, 0)

	for rows.Next() {
		var c Company
		err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.BusinessID,
			&c.PhoneNumber,
			&c.Verified,
			&c.CreatedAt,
			&c.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		companies = append(companies, c)
	}

	return companies, rows.Err()
}
