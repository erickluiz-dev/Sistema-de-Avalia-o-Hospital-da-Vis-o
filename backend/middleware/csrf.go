package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
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

func DefinirCSRFToken(w http.ResponseWriter, secure bool) (string, error) {
	token, err := gerarCSRFToken()
	if err != nil {
		return "", err
	}

	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}

	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: false,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   8 * 60 * 60,
	})

	return token, nil
}

// CSRFTokenHandler emite um cookie CSRF e retorna o mesmo token ao frontend.
// A proteção continua ativa: operações mutáveis precisam enviar o token no cabeçalho.
func CSRFTokenHandler(secure bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", http.MethodGet)
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}

		token, err := DefinirCSRFToken(w, secure)
		if err != nil {
			http.Error(w, "Não foi possível gerar token CSRF", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{"csrf_token": token}); err != nil {
			return
		}
	}
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

		if r.URL.Path == "/login" ||
			r.URL.Path == "/recuperacao-senha" ||
			r.URL.Path == "/redefinir-senha" {
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

func LimparCSRFToken(w http.ResponseWriter, secure bool) {
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Value:    "",
		Path:     "/",
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   -1,
	})
}
