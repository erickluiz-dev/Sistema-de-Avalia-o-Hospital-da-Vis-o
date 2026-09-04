package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestExigirAutenticacao_DevePermitirUsuarioAutenticado(t *testing.T) {
	autenticar := func(r *http.Request) (UsuarioAutenticado, error) {
		return UsuarioAutenticado{
			ID:            1,
			Administrador: false,
		}, nil
	}

	handler := ExigirAutenticacao(
		autenticar,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}),
	)

	req := httptest.NewRequest(http.MethodGet, "/teste", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(
			"esperado status 200, recebido %d",
			rec.Code,
		)
	}
}

func TestExigirAutenticacao_DeveBloquearNaoAutenticado(t *testing.T) {
	autenticar := func(r *http.Request) (UsuarioAutenticado, error) {
		return UsuarioAutenticado{}, http.ErrNoCookie
	}

	handler := ExigirAutenticacao(
		autenticar,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Fatal("handler não deveria ser executado")
		}),
	)

	req := httptest.NewRequest(http.MethodGet, "/teste", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf(
			"esperado status 401, recebido %d",
			rec.Code,
		)
	}
}

func TestExigirAdmin_DevePermitirAdministrador(t *testing.T) {
	autenticar := func(r *http.Request) (UsuarioAutenticado, error) {
		return UsuarioAutenticado{
			ID:            1,
			Administrador: true,
		}, nil
	}

	handler := ExigirAutenticacao(
		autenticar,
		ExigirAdmin(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}),
		),
	)

	req := httptest.NewRequest(http.MethodGet, "/admin/teste", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(
			"esperado status 200, recebido %d",
			rec.Code,
		)
	}
}

func TestExigirAdmin_DeveBloquearUsuarioComum(t *testing.T) {
	autenticar := func(r *http.Request) (UsuarioAutenticado, error) {
		return UsuarioAutenticado{
			ID:            2,
			Administrador: false,
		}, nil
	}

	handler := ExigirAutenticacao(
		autenticar,
		ExigirAdmin(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				t.Fatal("handler não deveria ser executado")
			}),
		),
	)

	req := httptest.NewRequest(http.MethodGet, "/admin/teste", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf(
			"esperado status 403, recebido %d",
			rec.Code,
		)
	}
}