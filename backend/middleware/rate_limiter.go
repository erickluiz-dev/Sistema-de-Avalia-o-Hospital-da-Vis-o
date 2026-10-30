package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type clientData struct {
	count       int
	windowStart time.Time
}

type RateLimiter struct {
	mu         sync.Mutex
	clients    map[string]*clientData
	limit      int
	window     time.Duration
	ipResolver *ClientIPResolver
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		clients:    make(map[string]*clientData),
		limit:      limit,
		window:     window,
		ipResolver: NewClientIPResolver(),
	}

	go rl.cleanupLoop()
	return rl
}

// Middleware aplica o limite a todas as requisições recebidas.
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return rl.MiddlewareExcept(next)
}

// MiddlewareExcept aplica o limite normalmente, exceto aos caminhos informados.
// Os caminhos excluídos devem receber uma política própria em outro ponto da
// configuração de rotas.
func (rl *RateLimiter) MiddlewareExcept(next http.Handler, excludedPrefixes ...string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for _, prefix := range excludedPrefixes {
			if strings.HasPrefix(r.URL.Path, prefix) {
				next.ServeHTTP(w, r)
				return
			}
		}

		retryAfter := int(rl.window.Seconds())
		if retryAfter < 1 {
			retryAfter = 1
		}

		ip := rl.ipResolver.ObterIP(r)

		rl.mu.Lock()
		now := time.Now()
		client, exists := rl.clients[ip]

		if !exists || now.Sub(client.windowStart) >= rl.window {
			rl.clients[ip] = &clientData{
				count:       1,
				windowStart: now,
			}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		if client.count >= rl.limit {
			rl.mu.Unlock()
			w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
			http.Error(
				w,
				"Muitas requisições. Tente novamente mais tarde.",
				http.StatusTooManyRequests,
			)
			return
		}

		client.count++
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.limparExpirados()
	}
}

func (rl *RateLimiter) limparExpirados() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	agora := time.Now()
	for ip, client := range rl.clients {
		if agora.Sub(client.windowStart) >= rl.window {
			delete(rl.clients, ip)
		}
	}
}
