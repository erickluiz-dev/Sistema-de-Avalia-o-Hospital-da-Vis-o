// backend/handlers/atendimento.go
package handlers

import (
	"backend/atendimento"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
)

type AtendimentoHandler struct {
	Manager *atendimento.Manager
}

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
	if err := decodeAtendimentoRequest(w, r, &req); err != nil {
		http.Error(w, "Requisição inválida", http.StatusBadRequest)
		return
	}

	status, err := h.Manager.Heartbeat(
		req.DepartmentID,
		req.TerminalID,
		req.ClientID,
		atendimento.Role(req.Role),
	)
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

	query := r.URL.Query()
	departmentID, errDepartment := strconv.Atoi(query.Get("department_id"))
	terminalID, errTerminal := strconv.Atoi(query.Get("terminal_id"))
	clientID := query.Get("client_id")
	role := atendimento.Role(query.Get("role"))

	if errDepartment != nil || errTerminal != nil {
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
	if err := decodeAtendimentoRequest(w, r, &req); err != nil {
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
	if err := decodeAtendimentoRequest(w, r, &req); err != nil {
		http.Error(w, "Requisição inválida", http.StatusBadRequest)
		return
	}

	h.Manager.Leave(req.DepartmentID, req.TerminalID, req.ClientID)
	w.WriteHeader(http.StatusNoContent)
}

// decodeAtendimentoRequest limita o tamanho do corpo e rejeita JSON inválido
// ou com mais de um objeto, mantendo o contrato atual dos endpoints.
func decodeAtendimentoRequest(
	w http.ResponseWriter,
	r *http.Request,
	dst *atendimentoRequest,
) error {
	r.Body = http.MaxBytesReader(w, r.Body, 4096)

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(dst); err != nil {
		return err
	}

	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		return errors.New("corpo JSON contém dados adicionais ou inválidos")
	}

	return nil
}

func methodNotAllowed(w http.ResponseWriter) {
	http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
