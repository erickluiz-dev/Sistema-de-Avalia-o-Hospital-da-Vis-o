package middleware

import (
	"net/http"

	"backend/handlers"
)

func ExigirAutenticacao(
	authHandler *handlers.AuthHandler,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		_, err := authHandler.Authenticate(r)

		if err != nil {
			http.Error(
				w,
				"Não autenticado",
				http.StatusUnauthorized,
			)
			return
		}

		next.ServeHTTP(w, r)
	})
}