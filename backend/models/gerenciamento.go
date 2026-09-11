package models

type UsuarioGerenciamento struct {
	ID            int64  `json:"id"`
	Nome          string `json:"nome"`
	Login         string `json:"login"`
	Administrador bool   `json:"administrador"`
}

type CriarUsuarioRequest struct {
	Nome          string `json:"nome"`
	Login         string `json:"login"`
	Senha         string `json:"senha"`
	Administrador bool   `json:"administrador"`
}

type DepartamentoGerenciamento struct {
	ID    int64  `json:"id"`
	Nome  string `json:"nome"`
	Ativo bool   `json:"ativo"`
}

type CriarDepartamentoRequest struct {
	Nome string `json:"nome"`
}

type TerminalGerenciamento struct {
	ID             int64  `json:"id"`
	Terminal       string `json:"terminal"`
	DepartamentoID int64  `json:"departamento_id"`
	Departamento   string `json:"departamento"`
	Ativo          bool   `json:"ativo"`
}

type CriarTerminalRequest struct {
	Terminal       string `json:"terminal"`
	DepartamentoID int64  `json:"departamento_id"`
}

type FuncionarioGerenciamento struct {
	ID             int64  `json:"id"`
	Nome           string `json:"nome"`
	TerminalID     *int64 `json:"terminal_id"`
	Terminal       string `json:"terminal"`
	DepartamentoID *int64 `json:"departamento_id"`
	Departamento   string `json:"departamento"`
	Ativo          bool   `json:"ativo"`
}

type CriarFuncionarioRequest struct {
	Nome       string `json:"nome"`
	TerminalID int64  `json:"terminal_id"`
}

type AtualizarVinculoTerminalRequest struct {
	TerminalID *int64 `json:"terminal_id"`
}
