package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
)

const csrfCookieName = "csrf_token"

func gerarCSRFToken() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

func DefinirCSRFToken(w http.ResponseWriter) error {
	token, err := gerarCSRFToken()
	if err != nil {
		return err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: false,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   8 * 60 * 60,
	})

	return nil
}

func ExigirCSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost &&
			r.Method != http.MethodPut &&
			r.Method != http.MethodPatch &&
			r.Method != http.MethodDelete {
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie(csrfCookieName)

		if err != nil || cookie.Value == "" {
			http.Error(
				w,
				"Token CSRF ausente",
				http.StatusForbidden,
			)
			return
		}

		headerToken := r.Header.Get("X-CSRF-Token")

		if headerToken == "" {
			http.Error(
				w,
				"Token CSRF ausente",
				http.StatusForbidden,
			)
			return
		}

		if subtle.ConstantTimeCompare(
			[]byte(cookie.Value),
			[]byte(headerToken),
		) != 1 {
			http.Error(
				w,
				"Token CSRF inválido",
				http.StatusForbidden,
			)
			return
		}

		next.ServeHTTP(w, r)
	})
}
