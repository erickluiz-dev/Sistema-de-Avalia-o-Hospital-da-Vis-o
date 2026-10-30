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

type AtendimentoHandler struct{ Manager *atendimento.Manager }

type atendimentoRequest struct {
	DepartmentID int    `json:"department_id"`
	TerminalID   int    `json:"terminal_id"`
	ClientID     string `json:"client_id"`
	Role         string `json:"role"`
}

type atendimentoDataRequest struct {
	DepartmentID int    `json:"department_id"`
	TerminalID   int    `json:"terminal_id"`
	ClientID     string `json:"client_id"`
	Role         string `json:"role"`
	Nome         string `json:"nome"`
	Telefone     string `json:"telefone"`
	Email        string `json:"email"`
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
	query := r.URL.Query()
	departmentID, errDepartment := strconv.Atoi(query.Get("department_id"))
	terminalID, errTerminal := strconv.Atoi(query.Get("terminal_id"))
	if errDepartment != nil || errTerminal != nil {
		http.Error(w, "Seleção inválida", http.StatusBadRequest)
		return
	}
	status, err := h.Manager.Status(departmentID, terminalID, query.Get("client_id"), atendimento.Role(query.Get("role")))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

// PatientData accepts initial patient data from the authenticated staff screen.
func (h *AtendimentoHandler) PatientData(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var req atendimentoDataRequest
		if err := decodeAtendimentoDataRequest(w, r, &req); err != nil {
			http.Error(w, "Requisição inválida", http.StatusBadRequest)
			return
		}
		if req.Role != string(atendimento.RoleFuncionario) {
			http.Error(w, "Somente o funcionário pode enviar os dados iniciais", http.StatusForbidden)
			return
		}
		err := h.Manager.SubmitPatientData(req.DepartmentID, req.TerminalID, req.ClientID, atendimento.PatientData{Nome: req.Nome, Telefone: req.Telefone, Email: req.Email})
		if err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"data_submitted": true})
	case http.MethodGet:
		q := r.URL.Query()
		departmentID, errDepartment := strconv.Atoi(q.Get("department_id"))
		terminalID, errTerminal := strconv.Atoi(q.Get("terminal_id"))
		if errDepartment != nil || errTerminal != nil {
			http.Error(w, "Seleção inválida", http.StatusBadRequest)
			return
		}
		if q.Get("role") != string(atendimento.RolePaciente) {
			http.Error(w, "Somente o tablet do paciente pode consultar os dados iniciais", http.StatusForbidden)
			return
		}
		state, err := h.Manager.Review(departmentID, terminalID, q.Get("client_id"), atendimento.RolePaciente)
		if err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		writeJSON(w, http.StatusOK, state)
	default:
		methodNotAllowed(w)
	}
}

// PatientReview receives corrections from the tablet and lets the staff screen
// poll for the reviewed data. The GET side must be protected by staff auth in routes.go.
func (h *AtendimentoHandler) PatientReview(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var req atendimentoDataRequest
		if err := decodeAtendimentoDataRequest(w, r, &req); err != nil {
			http.Error(w, "Requisição inválida", http.StatusBadRequest)
			return
		}
		if req.Role != string(atendimento.RolePaciente) {
			http.Error(w, "Somente o paciente pode enviar a conferência", http.StatusForbidden)
			return
		}
		err := h.Manager.SubmitReview(req.DepartmentID, req.TerminalID, req.ClientID, atendimento.PatientData{Nome: req.Nome, Telefone: req.Telefone, Email: req.Email})
		if err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"review_submitted": true})
	case http.MethodGet:
		q := r.URL.Query()
		departmentID, errDepartment := strconv.Atoi(q.Get("department_id"))
		terminalID, errTerminal := strconv.Atoi(q.Get("terminal_id"))
		if errDepartment != nil || errTerminal != nil {
			http.Error(w, "Seleção inválida", http.StatusBadRequest)
			return
		}
		if q.Get("role") != string(atendimento.RoleFuncionario) {
			http.Error(w, "Somente o funcionário pode consultar o resultado da conferência", http.StatusForbidden)
			return
		}
		state, err := h.Manager.Review(departmentID, terminalID, q.Get("client_id"), atendimento.RoleFuncionario)
		if err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		writeJSON(w, http.StatusOK, state)
	default:
		methodNotAllowed(w)
	}
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

// Complete encerra o atendimento após a avaliação ser salva com sucesso.
func (h *AtendimentoHandler) Complete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var req atendimentoRequest
	if err := decodeAtendimentoRequest(w, r, &req); err != nil {
		http.Error(w, "Requisição inválida", http.StatusBadRequest)
		return
	}
	if req.Role != string(atendimento.RolePaciente) {
		http.Error(w, "Somente o tablet do paciente pode finalizar o atendimento", http.StatusForbidden)
		return
	}
	if err := h.Manager.Complete(req.DepartmentID, req.TerminalID, req.ClientID); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"completed": true})
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

func decodeAtendimentoRequest(
	w http.ResponseWriter,
	r *http.Request,
	dst *atendimentoRequest,
) error {
	return decodeJSON(w, r, 4096, dst)
}

func decodeAtendimentoDataRequest(
	w http.ResponseWriter,
	r *http.Request,
	dst *atendimentoDataRequest,
) error {
	return decodeJSON(w, r, 8192, dst)
}
func decodeJSON(
	w http.ResponseWriter,
	r *http.Request,
	maxBytes int64,
	dst any,
) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

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
