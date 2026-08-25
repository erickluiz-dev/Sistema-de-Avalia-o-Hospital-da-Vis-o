package middleware

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

type LoginAttempt struct {
	count             int
	primeiraTentativa time.Time
	bloqueadoAte      time.Time
}

type LoginLimiter struct {
	mu sync.Mutex

	tentativasIP      map[string]*LoginAttempt
	tentativasUsuario map[string]*LoginAttempt

	maxTentativas int
	janela        time.Duration
	tempoBloqueio time.Duration

	ipResolver *ClientIPResolver
}

func NewLoginLimiter() *LoginLimiter {
	limiter := &LoginLimiter{
		tentativasIP:      make(map[string]*LoginAttempt),
		tentativasUsuario: make(map[string]*LoginAttempt),

		maxTentativas: 10,
		janela:        5 * time.Minute,
		tempoBloqueio: 5 * time.Minute,

		ipResolver: NewClientIPResolver(),
	}

	go limiter.cleanupLoop()

	return limiter
}

func (l *LoginLimiter) PodeTentar(
	mapa map[string]*LoginAttempt,
	chave string,
) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	agora := time.Now()

	tentativa, existe := mapa[chave]

	if !existe {
		mapa[chave] = &LoginAttempt{
			count:             1,
			primeiraTentativa: agora,
		}

		return true
	}

	if agora.Before(tentativa.bloqueadoAte) {
		return false
	}

	if agora.Sub(tentativa.primeiraTentativa) >= l.janela {
		tentativa.count = 1
		tentativa.primeiraTentativa = agora
		tentativa.bloqueadoAte = time.Time{}

		return true
	}

	tentativa.count++

	if tentativa.count > l.maxTentativas {
		tentativa.bloqueadoAte = agora.Add(
			l.tempoBloqueio,
		)

		return false
	}

	return true
}

func (l *LoginLimiter) Limpar(
	mapa map[string]*LoginAttempt,
	chave string,
) {
	l.mu.Lock()
	defer l.mu.Unlock()

	delete(mapa, chave)
}

func (l *LoginLimiter) ObterIP(
	r *http.Request,
) string {
	return l.ipResolver.ObterIP(r)
}

func (l *LoginLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodPost {
			next.ServeHTTP(w, r)
			return
		}

		ip := l.ObterIP(r)

		if !l.PodeTentar(
			l.tentativasIP,
			ip,
		) {
			http.Error(
				w,
				"Muitas tentativas de login. Tente novamente mais tarde.",
				http.StatusTooManyRequests,
			)
			return
		}

		r.Body = http.MaxBytesReader(
			w,
			r.Body,
			10<<10,
		)

		body, err := io.ReadAll(r.Body)

		if err != nil {
			http.Error(
				w,
				"Dados inválidos",
				http.StatusBadRequest,
			)
			return
		}

		r.Body.Close()

		r.Body = io.NopCloser(
			strings.NewReader(string(body)),
		)

		var req struct {
			Login string `json:"login"`
		}

		if err := json.Unmarshal(body, &req); err != nil {
			http.Error(
				w,
				"Dados inválidos",
				http.StatusBadRequest,
			)
			return
		}

		login := NormalizarLogin(req.Login)

		if login == "" {
			http.Error(
				w,
				"Login e senha são obrigatórios",
				http.StatusBadRequest,
			)
			return
		}

		if !l.PodeTentar(
			l.tentativasUsuario,
			login,
		) {
			http.Error(
				w,
				"Muitas tentativas de login. Tente novamente mais tarde.",
				http.StatusTooManyRequests,
			)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (l *LoginLimiter) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		l.limparExpiradas()
	}
}

func (l *LoginLimiter) limparExpiradas() {
	l.mu.Lock()
	defer l.mu.Unlock()

	agora := time.Now()

	limparMapa := func(
		mapa map[string]*LoginAttempt,
	) {
		for chave, tentativa := range mapa {

			if !tentativa.bloqueadoAte.IsZero() {
				if agora.After(tentativa.bloqueadoAte) {
					delete(mapa, chave)
				}

				continue
			}

			if agora.Sub(
				tentativa.primeiraTentativa,
			) >= l.janela {
				delete(mapa, chave)
			}
		}
	}

	limparMapa(l.tentativasIP)
	limparMapa(l.tentativasUsuario)
}

func (l *LoginLimiter) PodeTentarUsuario(login string) bool {
	return l.PodeTentar(
		l.tentativasUsuario,
		NormalizarLogin(login),
	)
}

func (l *LoginLimiter) LimparUsuario(login string) {
	l.Limpar(
		l.tentativasUsuario,
		NormalizarLogin(login),
	)
}

func NormalizarLogin(login string) string {
	return strings.ToLower(
		strings.TrimSpace(login),
	)
}

