package middleware

import (
	"context"
	"net/http"
)

type UsuarioAutenticado struct {
	ID            int64
	Administrador bool
}

type Authenticator func(r *http.Request) (UsuarioAutenticado, error)

type contextKey string

const usuarioContextKey contextKey = "usuario_autenticado"

func ExigirAutenticacao(
	autenticar Authenticator,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		usuario, err := autenticar(r)

		if err != nil {
			http.Error(
				w,
				"Não autenticado",
				http.StatusUnauthorized,
			)
			return
		}

		ctx := context.WithValue(
			r.Context(),
			usuarioContextKey,
			usuario,
		)

		next.ServeHTTP(
			w,
			r.WithContext(ctx),
		)
	})
}

func UsuarioDoContexto(r *http.Request) (UsuarioAutenticado, bool) {
	usuario, ok := r.Context().Value(usuarioContextKey).(UsuarioAutenticado)

	return usuario, ok
}

func ExigirAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		usuario, ok := UsuarioDoContexto(r)

		if !ok {
			http.Error(
				w,
				"Não autenticado",
				http.StatusUnauthorized,
			)
			return
		}

		if !usuario.Administrador {
			http.Error(
				w,
				"Acesso negado",
				http.StatusForbidden,
			)
			return
		}

		next.ServeHTTP(w, r)
	})
}