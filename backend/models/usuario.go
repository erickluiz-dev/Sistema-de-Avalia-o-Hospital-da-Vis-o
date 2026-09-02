package models

type LoginRequest struct {
	Login string `json:"login"`
	Senha string `json:"senha"`
}

type UsuarioResposta struct {
	Id    int64  `json:"id"`
	Nome  string `json:"nome"`
	Login string `json:"login"`
	Administrador bool `json:"administrador"`
}