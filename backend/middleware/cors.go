package middleware

import (
	"net/http"
	"os"
	"strings"
)

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		allowedOrigins := strings.Split(
			os.Getenv("	FrontendURL"),
			",",
		)

		permitida := false

		for _, allowed := range allowedOrigins {
			if strings.TrimSpace(allowed) == origin {
				permitida = true
				break
			}
		}

		if permitida {
			w.Header().Set(
				"Access-Control-Allow-Origin",
				origin,
			)

			w.Header().Set(
				"Access-Control-Allow-Credentials",
				"true",
			)

			w.Header().Set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE, OPTIONS",
			)

			w.Header().Set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization, X-CSRF-Token",
			)

			w.Header().Set(
				"Vary",
				"Origin",
			)
		}

		if r.Method == http.MethodOptions {
			if !permitida {
				http.Error(
					w,
					"Origem não permitida",
					http.StatusForbidden,
				)
				return
			}

			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}