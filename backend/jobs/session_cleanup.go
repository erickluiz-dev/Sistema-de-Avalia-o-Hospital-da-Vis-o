package jobs

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func IniciarLimpezaSessoes(
	db *pgxpool.Pool,
	intervalo time.Duration,
) {
	go func() {
		ticker := time.NewTicker(intervalo)
		defer ticker.Stop()

		for {
			limparSessoesExpiradas(db)

			<-ticker.C
		}
	}()
}

func limparSessoesExpiradas(db *pgxpool.Pool) {
	ctx, cancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)
	defer cancel()

	resultado, err := db.Exec(
		ctx,
		`
		DELETE FROM sessoes
		WHERE expira_em <= NOW()
		`,
	)

	if err != nil {
		log.Println(
			"Erro ao limpar sessões expiradas:",
			err,
		)
		return
	}

	if resultado.RowsAffected() > 0 {
		log.Printf(
			"Sessões expiradas removidas: %d",
			resultado.RowsAffected(),
		)
	}
}
