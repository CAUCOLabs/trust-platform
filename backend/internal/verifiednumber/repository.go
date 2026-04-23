package verifiednumber

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

func (r *Repository) Create(ctx context.Context, req CreateVerifiedNumberRequest) (VerifiedNumber, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var vn VerifiedNumber
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err := r.db.QueryRow(ctx, `
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

	normalizedPhone := phone.Normalize(phoneNumber)

	var res LookupResponse
	var reasonTitle *string
	var reasonDescription *string
	var reasonPriority *string
	var reasonExpiresAt *time.Time

	err := r.db.QueryRow(ctx, `
		SELECT
			vn.phone_number,
			vn.company_id,
			c.name,
			vn.label,
			vn.verified,
			cr.title,
			cr.description,
			cr.priority,
			cr.expires_at
		FROM verified_numbers vn
		INNER JOIN companies c ON c.id = vn.company_id
		LEFT JOIN call_reasons cr
			ON cr.company_id = c.id
			AND cr.active = TRUE
			AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
		WHERE vn.phone_number = $1
		ORDER BY cr.id DESC
		LIMIT 1
	`, normalizedPhone).Scan(
		&res.PhoneNumber,
		&res.CompanyID,
		&res.CompanyName,
		&res.Label,
		&res.Verified,
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

	res.Found = true

	if reasonTitle != nil && reasonDescription != nil && reasonPriority != nil {
		res.CallReason = &LookupCallReason{
			Title:       *reasonTitle,
			Description: *reasonDescription,
			Priority:    *reasonPriority,
			ExpiresAt:   reasonExpiresAt,
		}
	}

	return res, nil
}
