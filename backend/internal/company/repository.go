package company

import (
	"context"
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

func (r *Repository) Create(ctx context.Context, req CreateCompanyRequest) (Company, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Company{}, err
	}
	defer tx.Rollback(ctx)

	var c Company
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err = tx.QueryRow(ctx, `
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
	if err != nil {
		return Company{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "company_created",
			ResourceType: "company",
			ResourceID:   c.ID,
			Message:      fmt.Sprintf("Company %s created.", c.Name),
		})
		if err != nil {
			return Company{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Company{}, err
	}

	return c, nil
}

func (r *Repository) Update(ctx context.Context, id int64, req UpdateCompanyRequest) (Company, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Company{}, err
	}
	defer tx.Rollback(ctx)

	var c Company
	normalizedPhone := phone.Normalize(req.PhoneNumber)

	err = tx.QueryRow(ctx, `
		UPDATE companies
		SET
			name = $2,
			business_id = $3,
			phone_number = $4,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, business_id, phone_number, verified, created_at, updated_at
	`, id, req.Name, req.BusinessID, normalizedPhone).Scan(
		&c.ID,
		&c.Name,
		&c.BusinessID,
		&c.PhoneNumber,
		&c.Verified,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		return Company{}, err
	}

	if r.auditRepo != nil {
		err = r.auditRepo.Record(ctx, tx, auditlog.RecordParams{
			EventType:    "company_updated",
			ResourceType: "company",
			ResourceID:   c.ID,
			Message:      fmt.Sprintf("Company %s updated.", c.Name),
		})
		if err != nil {
			return Company{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Company{}, err
	}

	return c, nil
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

func (r *Repository) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	commandTag, err := tx.Exec(ctx, `
		DELETE FROM companies
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
			EventType:    "company_deleted",
			ResourceType: "company",
			ResourceID:   id,
			Message:      fmt.Sprintf("Company %d deleted.", id),
		})
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
