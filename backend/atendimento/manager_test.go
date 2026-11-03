// novo backend/atendimento/manager_test.go
package atendimento

import (
	"errors"
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
	if err := m.SubmitPatientData(1, 3, "pc", PatientData{Nome: "Paciente Teste"}); err != nil {
		t.Fatalf("funcionário deveria enviar os dados: %v", err)
	}
	// A conferência é opcional no fluxo atual: se o funcionário já enviou
	// os dados, ele pode liberar a avaliação sem aguardar correções.
	if err := m.Authorize(1, 3, "pc"); err != nil {
		t.Fatalf("funcionário deveria poder liberar sem conferência obrigatória: %v", err)
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
	if err := m.SubmitPatientData(1, 3, "pc", PatientData{Nome: "Paciente Teste"}); err != nil {
		t.Fatal(err)
	}
	if err := m.SubmitReview(1, 3, "tablet", PatientData{Nome: "Paciente Teste"}); err != nil {
		t.Fatal(err)
	}
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

func TestPatientDataFlowsOnlyAfterSubmissionAndReview(t *testing.T) {
	m := NewManager()
	_, _ = m.Heartbeat(4, 8, "pc", RoleFuncionario)
	_, _ = m.Heartbeat(4, 8, "tablet", RolePaciente)
	if _, err := m.Review(4, 8, "tablet", RolePaciente); err != nil {
		t.Fatal(err)
	}
	state, err := m.Review(4, 8, "tablet", RolePaciente)
	if err != nil {
		t.Fatal(err)
	}
	if state.DataSubmitted {
		t.Fatal("não deve haver dados antes do envio pelo atendente")
	}
	if err := m.SubmitPatientData(4, 8, "pc", PatientData{Nome: "  Maria  ", Telefone: " 123 ", Email: " maria@example.com "}); err != nil {
		t.Fatal(err)
	}
	state, err = m.Review(4, 8, "tablet", RolePaciente)
	if err != nil {
		t.Fatal(err)
	}
	if !state.DataSubmitted || state.Data.Nome != "Maria" || state.Data.Telefone != "123" || state.Data.Email != "maria@example.com" {
		t.Fatalf("dados não normalizados ou não compartilhados: %+v", state)
	}
	if err := m.SubmitReview(4, 8, "tablet", PatientData{Nome: "Maria Silva", Telefone: "123", Email: "maria@example.com"}); err != nil {
		t.Fatal(err)
	}
	state, err = m.Review(4, 8, "pc", RoleFuncionario)
	if err != nil {
		t.Fatal(err)
	}
	if !state.ReviewSubmitted || state.Data.Nome != "Maria Silva" {
		t.Fatalf("conferência não retornou ao funcionário: %+v", state)
	}
}

func TestCannotReadOrSubmitPatientDataFromWrongClientRole(t *testing.T) {
	m := NewManager()
	_, _ = m.Heartbeat(1, 2, "pc", RoleFuncionario)
	_, _ = m.Heartbeat(1, 2, "tablet", RolePaciente)
	if err := m.SubmitPatientData(1, 2, "tablet", PatientData{Nome: "Maria"}); err == nil {
		t.Fatal("tablet não deve enviar dados iniciais como funcionário")
	}
	if _, err := m.Review(1, 2, "unknown", RolePaciente); err == nil {
		t.Fatal("cliente desconhecido não deve ler dados")
	}
}

func TestManagerAllowsOnlyOneActiveDevicePerRole(t *testing.T) {
	m := NewManager()
	now := time.Now()
	m.now = func() time.Time { return now }

	// Primeiro computador ocupa a vaga de funcionário.
	if _, err := m.Heartbeat(7, 9, "pc-1", RoleFuncionario); err != nil {
		t.Fatalf("primeiro computador deveria conectar: %v", err)
	}
	// O mesmo dispositivo pode renovar a própria presença.
	if _, err := m.Heartbeat(7, 9, "pc-1", RoleFuncionario); err != nil {
		t.Fatalf("heartbeat do mesmo computador deveria ser permitido: %v", err)
	}
	// Outro computador não pode ocupar a mesma vaga enquanto o primeiro está ativo.
	if _, err := m.Heartbeat(7, 9, "pc-2", RoleFuncionario); !errors.Is(err, ErrRoleAlreadyConnected) {
		t.Fatalf("segundo computador deveria ser recusado com ErrRoleAlreadyConnected; recebido: %v", err)
	}
	// A vaga do tablet é independente da vaga do computador.
	if _, err := m.Heartbeat(7, 9, "tablet-1", RolePaciente); err != nil {
		t.Fatalf("tablet deveria poder conectar na vaga de paciente: %v", err)
	}
	if _, err := m.Heartbeat(7, 9, "tablet-2", RolePaciente); !errors.Is(err, ErrRoleAlreadyConnected) {
		t.Fatalf("segundo tablet deveria ser recusado; recebido: %v", err)
	}
	// Depois que a presença expira, outro dispositivo pode assumir a vaga.
	now = now.Add(presenceTTL + time.Second)
	if _, err := m.Heartbeat(7, 9, "pc-2", RoleFuncionario); err != nil {
		t.Fatalf("novo computador deveria conectar após expiração: %v", err)
	}
}
