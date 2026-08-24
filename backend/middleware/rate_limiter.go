package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
	"strconv"
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
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		clients: make(map[string]*clientData),
		limit:   limit,
		window:  window,
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		retryAfter := int(rl.window.Seconds())

		ip := clientIP(r)

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

func clientIP(r *http.Request) string {
	// Para ambiente local e configuração simples,
	// RemoteAddr é suficiente.
	ip := r.RemoteAddr

	if host, _, ok := splitHostPort(ip); ok {
		return host
	}

	return ip
}

func splitHostPort(address string) (string, string, bool) {
	host, port, err := net.SplitHostPort(address)

	if err != nil {
		return "", "", false
	}

	return host, port, true
}