// novo backend/atendimento/manager.go
package atendimento

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

const presenceTTL = 8 * time.Second

type Role string

const (
	RoleFuncionario Role = "funcionario"
	RolePaciente    Role = "paciente"
)

type Client struct {
	ID       string
	Role     Role
	LastSeen time.Time
}

type Session struct {
	DepartmentID int
	TerminalID   int
	Clients      map[string]Client
	Authorized   bool
	UpdatedAt    time.Time
}

type Status struct {
	Connected         bool   `json:"connected"`
	CounterpartOnline bool   `json:"counterpart_online"`
	Authorized        bool   `json:"authorized"`
	Role              Role   `json:"role"`
	Message           string `json:"message"`
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
	if departmentID < 1 || terminalID < 1 || clientID == "" || len(clientID) > 128 || !validRole(role) {
		return Status{}, errors.New("seleção de atendimento inválida")
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

	// Um mesmo navegador não pode ocupar simultaneamente as duas funções.
	for id, client := range session.Clients {
		if id == clientID && client.Role != role {
			delete(session.Clients, id)
		}
	}
	session.Clients[clientID] = Client{ID: clientID, Role: role, LastSeen: now}
	session.UpdatedAt = now
	m.pruneLocked(now)
	return m.statusLocked(session, clientID, role, now), nil
}

func (m *Manager) Status(departmentID, terminalID int, clientID string, role Role) (Status, error) {
	if departmentID < 1 || terminalID < 1 || clientID == "" || !validRole(role) {
		return Status{}, errors.New("seleção de atendimento inválida")
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

func (m *Manager) Authorize(departmentID, terminalID int, clientID string) error {
	if departmentID < 1 || terminalID < 1 || clientID == "" {
		return errors.New("seleção de atendimento inválida")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	now := m.now()
	m.pruneLocked(now)
	session := m.sessions[sessionKey(departmentID, terminalID)]
	if session == nil || !m.hasOnlineRoleLocked(session, RoleFuncionario, now) || !m.hasOnlineRoleLocked(session, RolePaciente, now) {
		return errors.New("os dois dispositivos precisam estar conectados antes da liberação")
	}
	client, ok := session.Clients[clientID]
	if !ok || client.Role != RoleFuncionario || now.Sub(client.LastSeen) > presenceTTL {
		return errors.New("somente o computador conectado do funcionário pode liberar a avaliação")
	}
	session.Authorized = true
	session.UpdatedAt = now
	return nil
}

func (m *Manager) Leave(departmentID, terminalID int, clientID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	key := sessionKey(departmentID, terminalID)
	if session := m.sessions[key]; session != nil {
		if _, exists := session.Clients[clientID]; exists {
			delete(session.Clients, clientID)
			// Revoga a autorização quando um dos dispositivos sai.
			session.Authorized = false
		}
		if len(session.Clients) == 0 {
			delete(m.sessions, key)
		}
	}
}

func (m *Manager) statusLocked(session *Session, clientID string, role Role, now time.Time) Status {
	own, ownOK := session.Clients[clientID]
	ownOnline := ownOK && own.Role == role && now.Sub(own.LastSeen) <= presenceTTL
	counterpart := RolePaciente
	if role == RolePaciente {
		counterpart = RoleFuncionario
	}
	counterpartOnline := m.hasOnlineRoleLocked(session, counterpart, now)
	connected := ownOnline && counterpartOnline
	status := Status{Connected: connected, CounterpartOnline: counterpartOnline, Authorized: connected && session.Authorized, Role: role}
	if !ownOnline {
		status.Message = "Reconectando ao atendimento..."
	} else if !counterpartOnline {
		if role == RoleFuncionario {
			status.Message = "Aguardando o tablet do paciente selecionar o mesmo departamento e terminal."
		} else {
			status.Message = "Aguardando o computador do funcionário selecionar o mesmo departamento e terminal."
		}
	} else if session.Authorized {
		status.Message = "Dispositivos conectados. Avaliação liberada pelo funcionário."
	} else if role == RoleFuncionario {
		status.Message = "Tablet conectado. Confira os dados e libere a avaliação quando estiver pronto."
	} else {
		status.Message = "Computador conectado. Aguarde a conferência e a liberação do funcionário."
	}
	return status
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
		for id, client := range session.Clients {
			if now.Sub(client.LastSeen) > presenceTTL {
				delete(session.Clients, id)
				session.Authorized = false
			}
		}
		if len(session.Clients) == 0 {
			delete(m.sessions, key)
		}
	}
}
