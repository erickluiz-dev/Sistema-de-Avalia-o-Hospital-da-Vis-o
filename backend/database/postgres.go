package database

import (
	"context"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) (*pgxpool.Pool, error) {
	return pgxpool.New(
		context.Background(),
		databaseURL,
	)
}

func ConnectWithDialer(
	databaseURL string,
	dialer pgconn.DialFunc,
) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	config.ConnConfig.DialFunc = dialer

	return pgxpool.NewWithConfig(
		context.Background(),
		config,
	)
}

func Ping(db *pgxpool.Pool) error {
	return db.Ping(context.Background())
}
