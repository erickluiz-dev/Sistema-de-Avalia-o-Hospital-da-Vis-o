package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditoriaService struct {
	DB *pgxpool.Pool
}

func NewAuditoriaService(db *pgxpool.Pool) *AuditoriaService {
	return &AuditoriaService{
		DB: db,
	}
}

func (a *AuditoriaService) Registrar(
	ctx context.Context,
	usuarioID int64,
	acao string,
	recurso string,
	recursoID *int64,
	ip string,
	detalhes string,
) error {

	_, err := a.DB.Exec(
		ctx,
		`
		INSERT INTO auditoria (
			usuario_id,
			acao,
			recurso,
			recurso_id,
			ip,
			detalhes
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		`,
		usuarioID,
		acao,
		recurso,
		recursoID,
		ip,
		detalhes,
	)

	if err != nil {
		return fmt.Errorf(
			"erro ao registrar auditoria: %w",
			err,
		)
	}

	return nil
}