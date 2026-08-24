package middleware

import (
	"net"
	"net/http"
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
}

func NewLoginLimiter() *LoginLimiter {
	return &LoginLimiter{
		tentativasIP:      make(map[string]*LoginAttempt),
		tentativasUsuario: make(map[string]*LoginAttempt),
		maxTentativas:     10,
		janela:            5 * time.Minute,
		tempoBloqueio:     5 * time.Minute,
	}
}

func (l *LoginLimiter) PodeTentar(mapa map[string]*LoginAttempt, chave string) bool {
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
		tentativa.bloqueadoAte = agora.Add(l.tempoBloqueio)

		return false
	}

	return true
}

func (l *LoginLimiter) Limpar(mapa map[string]*LoginAttempt, chave string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	delete(mapa, chave)
}

func (l *LoginLimiter) ObterIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)

	if err != nil {
		return r.RemoteAddr
	}

	return host
}

func (l *LoginLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.Method != http.MethodPost {
			next.ServeHTTP(w, r)
			return
		}

		ip := l.ObterIP(r)

		if !l.PodeTentar(l.tentativasIP, ip) {
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