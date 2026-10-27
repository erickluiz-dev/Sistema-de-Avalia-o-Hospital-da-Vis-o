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
	if err := m.SubmitPatientData(1, 3, "pc", PatientData{Nome: "Paciente Teste"}); err != nil {
		t.Fatalf("funcionário deveria enviar os dados: %v", err)
	}
	if err := m.Authorize(1, 3, "pc"); err == nil {
		t.Fatal("não deveria liberar antes da conferência do paciente")
	}
	if err := m.SubmitReview(1, 3, "tablet", PatientData{Nome: "Paciente Corrigido"}); err != nil {
		t.Fatalf("paciente deveria enviar a conferência: %v", err)
	}
	if err := m.Authorize(1, 3, "pc"); err != nil {
		t.Fatalf("funcionário deveria liberar após a conferência: %v", err)
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
