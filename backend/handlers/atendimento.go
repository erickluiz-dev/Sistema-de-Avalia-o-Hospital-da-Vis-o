// novo backend/handlers/atendimento.go
package handlers

import (
	"backend/atendimento"
	"encoding/json"
	"net/http"
	"strconv"
)

type AtendimentoHandler struct{ Manager *atendimento.Manager }

type atendimentoRequest struct {
	DepartmentID int    `json:"department_id"`
	TerminalID   int    `json:"terminal_id"`
	ClientID     string `json:"client_id"`
	Role         string `json:"role"`
}

func (h *AtendimentoHandler) Presence(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var req atendimentoRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&req); err != nil {
		http.Error(w, "Requisição inválida", http.StatusBadRequest)
		return
	}
	status, err := h.Manager.Heartbeat(req.DepartmentID, req.TerminalID, req.ClientID, atendimento.Role(req.Role))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

func (h *AtendimentoHandler) Status(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	departmentID, err1 := strconv.Atoi(r.URL.Query().Get("department_id"))
	terminalID, err2 := strconv.Atoi(r.URL.Query().Get("terminal_id"))
	role := atendimento.Role(r.URL.Query().Get("role"))
	clientID := r.URL.Query().Get("client_id")
	if err1 != nil || err2 != nil {
		http.Error(w, "Seleção inválida", http.StatusBadRequest)
		return
	}
	status, err := h.Manager.Status(departmentID, terminalID, clientID, role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

func (h *AtendimentoHandler) Authorize(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var req atendimentoRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&req); err != nil {
		http.Error(w, "Requisição inválida", http.StatusBadRequest)
		return
	}
	if req.Role != string(atendimento.RoleFuncionario) {
		http.Error(w, "Somente o funcionário pode liberar a avaliação", http.StatusForbidden)
		return
	}
	if err := h.Manager.Authorize(req.DepartmentID, req.TerminalID, req.ClientID); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"authorized": true})
}

func (h *AtendimentoHandler) Leave(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var req atendimentoRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&req); err != nil {
		http.Error(w, "Requisição inválida", http.StatusBadRequest)
		return
	}
	h.Manager.Leave(req.DepartmentID, req.TerminalID, req.ClientID)
	w.WriteHeader(http.StatusNoContent)
}

func methodNotAllowed(w http.ResponseWriter) {
	http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
}
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
