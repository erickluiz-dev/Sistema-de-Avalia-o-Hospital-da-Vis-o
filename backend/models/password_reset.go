package models

type RecuperacaoSenhaRequest struct {
	Login string `json:"login"`
}

type RedefinicaoSenhaRequest struct {
	Token string `json:"token"`
	Senha string `json:"senha"`
}