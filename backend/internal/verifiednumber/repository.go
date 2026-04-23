package verifiednumber

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

func (r *Repository) Create(ctx context.Context, req CreateVerifiedNumberRequest) (VerifiedNumber, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var vn VerifiedNumber

	err := r.db.QueryRow(ctx, `
		INSERT INTO verified_numbers (company_id, phone_number, label)
		VALUES ($1, $2, $3)
		RETURNING id, company_id, phone_number, label, verified, created_at
	`, req.CompanyID, req.PhoneNumber, req.Label).Scan(
		&vn.ID,
		&vn.CompanyID,
		&vn.PhoneNumber,
		&vn.Label,
		&vn.Verified,
		&vn.CreatedAt,
	)

	return vn, err
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

	var res LookupResponse

	err := r.db.QueryRow(ctx, `
		SELECT
			vn.phone_number,
			vn.company_id,
			c.name,
			vn.label,
			vn.verified
		FROM verified_numbers vn
		INNER JOIN companies c ON c.id = vn.company_id
		WHERE vn.phone_number = $1
	`, phoneNumber).Scan(
		&res.PhoneNumber,
		&res.CompanyID,
		&res.CompanyName,
		&res.Label,
		&res.Verified,
	)

	if err == pgx.ErrNoRows {
		return LookupResponse{
			Found:       false,
			PhoneNumber: phoneNumber,
			Verified:    false,
		}, nil
	}

	if err != nil {
		return LookupResponse{}, err
	}

	res.Found = true
	return res, nil
}
