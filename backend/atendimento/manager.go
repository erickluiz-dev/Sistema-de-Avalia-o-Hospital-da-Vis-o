// backend/atendimento/manager.go
package atendimento

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)

const presenceTTL = 8 * time.Second

type Role string

const (
	RoleFuncionario Role = "funcionario"
	RolePaciente    Role = "paciente"
)

type PatientData struct {
	Nome     string `json:"nome"`
	Telefone string `json:"telefone"`
	Email    string `json:"email"`
}

type Client struct {
	ID       string
	Role     Role
	LastSeen time.Time
}

type Session struct {
	DepartmentID    int
	TerminalID      int
	Clients         map[string]Client
	PatientData     PatientData
	DataSubmitted   bool
	ReviewSubmitted bool
	Authorized      bool
	UpdatedAt       time.Time
}

type Status struct {
	Connected         bool   `json:"connected"`
	CounterpartOnline bool   `json:"counterpart_online"`
	Authorized        bool   `json:"authorized"`
	DataSubmitted     bool   `json:"data_submitted"`
	ReviewSubmitted   bool   `json:"review_submitted"`
	Role              Role   `json:"role"`
	Message           string `json:"message"`
}

type ReviewState struct {
	DataSubmitted   bool        `json:"data_submitted"`
	ReviewSubmitted bool        `json:"review_submitted"`
	Authorized      bool        `json:"authorized"`
	Data            PatientData `json:"data,omitempty"`
}

type Manager struct {
	mu       sync.Mutex
	sessions map[string]*Session
	now      func() time.Time
}

func NewManager() *Manager {
	return &Manager{sessions: make(map[string]*Session), now: time.Now}
}

func sessionKey(departmentID, terminalID int) string {
	return fmt.Sprintf("%d:%d", departmentID, terminalID)
}

func validRole(role Role) bool {
	return role == RoleFuncionario || role == RolePaciente
}

func (m *Manager) Heartbeat(departmentID, terminalID int, clientID string, role Role) (Status, error) {
	if err := validateSessionInput(departmentID, terminalID, clientID, role); err != nil {
		return Status{}, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	now := m.now()
	key := sessionKey(departmentID, terminalID)
	session := m.sessions[key]
	if session == nil {
		session = &Session{DepartmentID: departmentID, TerminalID: terminalID, Clients: make(map[string]Client), UpdatedAt: now}
		m.sessions[key] = session
	}

	if existing, ok := session.Clients[clientID]; ok && existing.Role != role {
		delete(session.Clients, clientID)
		resetFlowLocked(session)
	}
	session.Clients[clientID] = Client{ID: clientID, Role: role, LastSeen: now}
	session.UpdatedAt = now
	m.pruneLocked(now)

	session = m.sessions[key]
	if session == nil {
		session = &Session{DepartmentID: departmentID, TerminalID: terminalID, Clients: make(map[string]Client), UpdatedAt: now}
		m.sessions[key] = session
	}
	if session.Clients == nil {
		session.Clients = make(map[string]Client)
	}
	session.Clients[clientID] = Client{ID: clientID, Role: role, LastSeen: now}
	return m.statusLocked(session, clientID, role, now), nil
}

func (m *Manager) Status(departmentID, terminalID int, clientID string, role Role) (Status, error) {
	if err := validateSessionInput(departmentID, terminalID, clientID, role); err != nil {
		return Status{}, err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	now := m.now()
	m.pruneLocked(now)
	session := m.sessions[sessionKey(departmentID, terminalID)]
	if session == nil {
		return Status{Role: role, Message: "Aguardando o outro dispositivo selecionar o mesmo departamento e terminal."}, nil
	}
	return m.statusLocked(session, clientID, role, now), nil
}

// SubmitPatientData is called by the authenticated staff computer after the
// attendant presses "Validar e enviar". The data is only kept in this live
// in-memory session and is never returned to a client with the wrong role.
func (m *Manager) SubmitPatientData(departmentID, terminalID int, clientID string, data PatientData) error {
	if err := validateSessionInput(departmentID, terminalID, clientID, RoleFuncionario); err != nil {
		return err
	}
	if err := validatePatientData(data); err != nil {
		return err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	now := m.now()
	m.pruneLocked(now)
	session := m.sessions[sessionKey(departmentID, terminalID)]
	if session == nil || !m.clientOnlineLocked(session, clientID, RoleFuncionario, now) || !m.hasOnlineRoleLocked(session, RolePaciente, now) {
		return errors.New("o computador e o tablet precisam estar conectados ao mesmo atendimento")
	}
	session.PatientData = normalizePatientData(data)
	session.DataSubmitted = true
	session.ReviewSubmitted = false
	session.Authorized = false
	session.UpdatedAt = now
	return nil
}

// Review returns the current shared flow state to the matching device.
// Patient data is only exposed to the patient tablet and the staff computer
// belonging to this same live session.
func (m *Manager) Review(departmentID, terminalID int, clientID string, role Role) (ReviewState, error) {
	if err := validateSessionInput(departmentID, terminalID, clientID, role); err != nil {
		return ReviewState{}, err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	now := m.now()
	m.pruneLocked(now)
	session := m.sessions[sessionKey(departmentID, terminalID)]
	if session == nil || !m.clientOnlineLocked(session, clientID, role, now) {
		return ReviewState{}, errors.New("dispositivo não está conectado a este atendimento")
	}
	if !m.hasOnlineRoleLocked(session, oppositeRole(role), now) {
		return ReviewState{}, errors.New("o outro dispositivo não está conectado")
	}
	state := ReviewState{DataSubmitted: session.DataSubmitted, ReviewSubmitted: session.ReviewSubmitted, Authorized: session.Authorized}
	if session.DataSubmitted {
		state.Data = session.PatientData
	}
	return state, nil
}

// SubmitReview is called by the patient tablet after the patient confirms or
// corrects the fields. It marks the review complete but does not authorize the survey.
func (m *Manager) SubmitReview(departmentID, terminalID int, clientID string, data PatientData) error {
	if err := validateSessionInput(departmentID, terminalID, clientID, RolePaciente); err != nil {
		return err
	}
	if err := validatePatientData(data); err != nil {
		return err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	now := m.now()
	m.pruneLocked(now)
	session := m.sessions[sessionKey(departmentID, terminalID)]
	if session == nil || !m.clientOnlineLocked(session, clientID, RolePaciente, now) || !m.hasOnlineRoleLocked(session, RoleFuncionario, now) {
		return errors.New("o computador e o tablet precisam estar conectados ao mesmo atendimento")
	}
	if !session.DataSubmitted {
		return errors.New("os dados ainda não foram enviados pelo atendente")
	}
	session.PatientData = normalizePatientData(data)
	session.ReviewSubmitted = true
	session.Authorized = false
	session.UpdatedAt = now
	return nil
}

func (m *Manager) Authorize(departmentID, terminalID int, clientID string) error {
	if err := validateSessionInput(departmentID, terminalID, clientID, RoleFuncionario); err != nil {
		return err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	now := m.now()
	m.pruneLocked(now)
	session := m.sessions[sessionKey(departmentID, terminalID)]
	if session == nil || !m.clientOnlineLocked(session, clientID, RoleFuncionario, now) || !m.hasOnlineRoleLocked(session, RolePaciente, now) {
		return errors.New("os dois dispositivos precisam estar conectados antes da liberação")
	}
	// A conferência dos dados é opcional. A autorização depende da presença
	// dos dois dispositivos no mesmo atendimento, não do envio de dados pessoais.
	session.Authorized = true
	session.UpdatedAt = now
	return nil
}

func (m *Manager) Leave(departmentID, terminalID int, clientID string) {
	if departmentID < 1 || terminalID < 1 || clientID == "" {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	key := sessionKey(departmentID, terminalID)
	if session := m.sessions[key]; session != nil {
		if _, exists := session.Clients[clientID]; exists {
			delete(session.Clients, clientID)
			resetFlowLocked(session)
			session.UpdatedAt = m.now()
		}
		if len(session.Clients) == 0 {
			delete(m.sessions, key)
		}
	}
}

func (m *Manager) statusLocked(session *Session, clientID string, role Role, now time.Time) Status {
	ownOnline := m.clientOnlineLocked(session, clientID, role, now)
	counterpartOnline := m.hasOnlineRoleLocked(session, oppositeRole(role), now)
	status := Status{
		Connected:         ownOnline && counterpartOnline,
		CounterpartOnline: counterpartOnline,
		Authorized:        ownOnline && session.Authorized,
		DataSubmitted:     session.DataSubmitted,
		ReviewSubmitted:   session.ReviewSubmitted,
		Role:              role,
	}
	switch {
	case !ownOnline:
		status.Message = "Reconectando ao atendimento..."
	case !counterpartOnline && role == RoleFuncionario:
		status.Message = "Aguardando o tablet do paciente selecionar o mesmo departamento e terminal."
	case !counterpartOnline:
		status.Message = "Aguardando o computador do funcionário selecionar o mesmo departamento e terminal."
	case session.Authorized:
		status.Message = "Avaliação liberada pelo funcionário."
	case !session.DataSubmitted:
		status.Message = "Aguardando o atendente enviar os dados para conferência."
	case !session.ReviewSubmitted && role == RoleFuncionario:
		status.Message = "Aguardando o paciente conferir os dados no tablet."
	case !session.ReviewSubmitted:
		status.Message = "Confira os dados e envie a confirmação ao atendente."
	case role == RoleFuncionario:
		status.Message = "Conferência recebida. Revise os dados e libere a avaliação quando estiver pronto."
	default:
		status.Message = "Conferência enviada. Aguarde a liberação do funcionário."
	}
	return status
}

func (m *Manager) clientOnlineLocked(session *Session, clientID string, role Role, now time.Time) bool {
	client, ok := session.Clients[clientID]
	return ok && client.Role == role && now.Sub(client.LastSeen) <= presenceTTL
}

func oppositeRole(role Role) Role {
	if role == RolePaciente {
		return RoleFuncionario
	}
	return RolePaciente
}

func validateSessionInput(departmentID, terminalID int, clientID string, role Role) error {
	if departmentID < 1 || terminalID < 1 || strings.TrimSpace(clientID) == "" || len(clientID) > 128 || !validRole(role) {
		return errors.New("seleção de atendimento inválida")
	}
	return nil
}

func validatePatientData(data PatientData) error {
	data = normalizePatientData(data)
	// Nome, telefone e e-mail são opcionais neste fluxo.
	if len(data.Nome) > 200 || len(data.Telefone) > 32 || len(data.Email) > 254 {
		return errors.New("um ou mais campos excedem o tamanho permitido")
	}
	return nil
}

func normalizePatientData(data PatientData) PatientData {
	data.Nome = strings.TrimSpace(data.Nome)
	data.Telefone = strings.TrimSpace(data.Telefone)
	data.Email = strings.TrimSpace(data.Email)
	return data
}

func resetFlowLocked(session *Session) {
	session.PatientData = PatientData{}
	session.DataSubmitted = false
	session.ReviewSubmitted = false
	session.Authorized = false
}

func (m *Manager) hasOnlineRoleLocked(session *Session, role Role, now time.Time) bool {
	for _, client := range session.Clients {
		if client.Role == role && now.Sub(client.LastSeen) <= presenceTTL {
			return true
		}
	}
	return false
}

func (m *Manager) pruneLocked(now time.Time) {
	for key, session := range m.sessions {
		removed := false
		for id, client := range session.Clients {
			if now.Sub(client.LastSeen) > presenceTTL {
				delete(session.Clients, id)
				removed = true
			}
		}
		if removed {
			resetFlowLocked(session)
			session.UpdatedAt = now
		}
		if len(session.Clients) == 0 {
			delete(m.sessions, key)
		}
	}
}
