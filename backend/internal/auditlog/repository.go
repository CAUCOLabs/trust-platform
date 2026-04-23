package auditlog

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type queryRower interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Record(ctx context.Context, q queryRower, params RecordParams) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var id int64
	return q.QueryRow(ctx, `
		INSERT INTO audit_logs (event_type, resource_type, resource_id, message)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, params.EventType, params.ResourceType, params.ResourceID, params.Message).Scan(&id)
}

func (r *Repository) List(ctx context.Context) ([]AuditLog, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx, `
		SELECT id, event_type, resource_type, resource_id, message, created_at
		FROM audit_logs
		ORDER BY created_at DESC, id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AuditLog, 0)

	for rows.Next() {
		var item AuditLog
		err := rows.Scan(
			&item.ID,
			&item.EventType,
			&item.ResourceType,
			&item.ResourceID,
			&item.Message,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}
