package database

import (
	"context"
	"fmt"
	"time"

	"github.com/cauco/trust-platform/backend/internal/config"

	"github.com/jackc/pgx/v5"
)

func Connect(cfg config.Config) (*pgx.Conn, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		return nil, err
	}

	return conn, nil
}
