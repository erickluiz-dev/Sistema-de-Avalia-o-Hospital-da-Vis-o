package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestExigirCSRF_DevePermitirGET(t *testing.T) {
	handler := ExigirCSRF(
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

func TestExigirCSRF_DeveBloquearPOSTSemCookie(t *testing.T) {
	handler := ExigirCSRF(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Fatal("handler não deveria ser executado")
		}),
	)

	req := httptest.NewRequest(http.MethodPost, "/teste", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf(
			"esperado status 403, recebido %d",
			rec.Code,
		)
	}
}

func TestExigirCSRF_DeveBloquearPOSTSemHeader(t *testing.T) {
	handler := ExigirCSRF(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Fatal("handler não deveria ser executado")
		}),
	)

	req := httptest.NewRequest(http.MethodPost, "/teste", nil)

	req.AddCookie(&http.Cookie{
		Name:  csrfCookieName,
		Value: "token-valido",
	})

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf(
			"esperado status 403, recebido %d",
			rec.Code,
		)
	}
}

func TestExigirCSRF_DeveBloquearTokenInvalido(t *testing.T) {
	handler := ExigirCSRF(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Fatal("handler não deveria ser executado")
		}),
	)

	req := httptest.NewRequest(http.MethodPost, "/teste", nil)

	req.AddCookie(&http.Cookie{
		Name:  csrfCookieName,
		Value: "token-correto",
	})

	req.Header.Set("X-CSRF-Token", "token-incorreto")

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf(
			"esperado status 403, recebido %d",
			rec.Code,
		)
	}
}

func TestExigirCSRF_DevePermitirTokenValido(t *testing.T) {
	handler := ExigirCSRF(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}),
	)

	token := "token-correto"

	req := httptest.NewRequest(http.MethodPost, "/teste", nil)

	req.AddCookie(&http.Cookie{
		Name:  csrfCookieName,
		Value: token,
	})

	req.Header.Set("X-CSRF-Token", token)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf(
			"esperado status 200, recebido %d",
			rec.Code,
		)
	}
}