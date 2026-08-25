package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
)

type ClientIPResolver struct {
	trustedProxies []*net.IPNet
}

func NewClientIPResolver() *ClientIPResolver {
	return &ClientIPResolver{
		trustedProxies: loadTrustedProxyCIDRs(),
	}
}

func loadTrustedProxyCIDRs() []*net.IPNet {
	value := strings.TrimSpace(
		os.Getenv("TRUSTED_PROXY_CIDRS"),
	)

	if value == "" {
		return nil
	}

	var trusted []*net.IPNet

	for _, cidr := range strings.Split(value, ",") {
		cidr = strings.TrimSpace(cidr)

		if cidr == "" {
			continue
		}

		_, network, err := net.ParseCIDR(cidr)

		if err != nil {
			continue
		}

		trusted = append(trusted, network)
	}

	return trusted
}

func (r *ClientIPResolver) ObterIP(
	req *http.Request,
) string {
	remoteIP := extractRemoteIP(req.RemoteAddr)

	if !r.isTrustedProxy(remoteIP) {
		return remoteIP
	}

	if ip := strings.TrimSpace(
		req.Header.Get("X-Forwarded-For"),
	); ip != "" {
		parts := strings.Split(ip, ",")

		if len(parts) > 0 {
			clientIP := strings.TrimSpace(parts[0])

			if net.ParseIP(clientIP) != nil {
				return clientIP
			}
		}
	}

	if ip := strings.TrimSpace(
		req.Header.Get("X-Real-IP"),
	); net.ParseIP(ip) != nil {
		return ip
	}

	if ip := strings.TrimSpace(
		req.Header.Get("CF-Connecting-IP"),
	); net.ParseIP(ip) != nil {
		return ip
	}

	return remoteIP
}

func (r *ClientIPResolver) isTrustedProxy(
	ip string,
) bool {
	parsed := net.ParseIP(ip)

	if parsed == nil {
		return false
	}

	for _, network := range r.trustedProxies {
		if network.Contains(parsed) {
			return true
		}
	}

	return false
}

func extractRemoteIP(
	address string,
) string {
	host, _, err := net.SplitHostPort(address)

	if err == nil {
		return host
	}

	return address
}