// novo backend/atendimento/manager_test.go
package atendimento

import (
	"testing"
	"time"
)

func TestManagerRequiresMatchingDepartmentAndTerminal(t *testing.T) {
	m := NewManager()
	if _, err := m.Heartbeat(2, 5, "pc", RoleFuncionario); err != nil {
		t.Fatal(err)
	}
	status, err := m.Heartbeat(2, 6, "tablet", RolePaciente)
	if err != nil {
		t.Fatal(err)
	}
	if status.Connected {
		t.Fatal("dispositivos em terminais diferentes não deveriam conectar")
	}
	status, err = m.Heartbeat(2, 5, "tablet", RolePaciente)
	if err != nil {
		t.Fatal(err)
	}
	if !status.Connected {
		t.Fatal("dispositivos com departamento e terminal iguais deveriam conectar")
	}
	if status.Authorized {
		t.Fatal("a conexão não deve liberar a avaliação automaticamente")
	}
}

func TestManagerOnlyEmployeeCanAuthorizeWhenBothOnline(t *testing.T) {
	m := NewManager()
	now := time.Now()
	m.now = func() time.Time { return now }
	if _, err := m.Heartbeat(1, 3, "pc", RoleFuncionario); err != nil {
		t.Fatal(err)
	}
	if err := m.Authorize(1, 3, "pc"); err == nil {
		t.Fatal("não deveria liberar sem tablet conectado")
	}
	if _, err := m.Heartbeat(1, 3, "tablet", RolePaciente); err != nil {
		t.Fatal(err)
	}
	if err := m.Authorize(1, 3, "tablet"); err == nil {
		t.Fatal("tablet não pode liberar a avaliação")
	}
	if err := m.Authorize(1, 3, "pc"); err != nil {
		t.Fatalf("funcionário conectado deveria poder liberar: %v", err)
	}
	status, err := m.Status(1, 3, "tablet", RolePaciente)
	if err != nil {
		t.Fatal(err)
	}
	if !status.Authorized {
		t.Fatal("tablet deveria receber o estado autorizado")
	}
}

func TestManagerExpiresStalePresenceAndRevokesAuthorization(t *testing.T) {
	m := NewManager()
	now := time.Now()
	m.now = func() time.Time { return now }
	_, _ = m.Heartbeat(1, 3, "pc", RoleFuncionario)
	_, _ = m.Heartbeat(1, 3, "tablet", RolePaciente)
	if err := m.Authorize(1, 3, "pc"); err != nil {
		t.Fatal(err)
	}
	now = now.Add(presenceTTL + time.Second)
	status, err := m.Status(1, 3, "tablet", RolePaciente)
	if err != nil {
		t.Fatal(err)
	}
	if status.Authorized || status.Connected {
		t.Fatal("presença expirada não deve manter conexão ou autorização")
	}
}
