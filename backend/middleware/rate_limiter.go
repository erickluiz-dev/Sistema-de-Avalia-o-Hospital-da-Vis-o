package middleware

import (
	"net/http"
	"strconv"
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

func NewRateLimiter(
	limit int,
	window time.Duration,
) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*clientData),
		limit:   limit,
		window:  window,

		ipResolver: NewClientIPResolver(),
	}

	go rl.cleanupLoop()

	return rl
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		retryAfter := int(rl.window.Seconds())

		ip := rl.ipResolver.ObterIP(r)

		rl.mu.Lock()

		client, exists := rl.clients[ip]

		now := time.Now()

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

			w.Header().Set(
				"Retry-After",
				strconv.Itoa(retryAfter),
			)
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
	ticker := time.NewTicker(1 * time.Minute)
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