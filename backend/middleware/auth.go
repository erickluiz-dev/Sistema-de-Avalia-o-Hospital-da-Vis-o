package middleware

import "net/http"

type Authenticator func(r *http.Request) (int64, error)

func ExigirAutenticacao(
	autenticar Authenticator,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := autenticar(r)

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
