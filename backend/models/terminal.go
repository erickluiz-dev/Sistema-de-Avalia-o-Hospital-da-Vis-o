package models

type Terminal struct {
	ID             int64  `json:"id"`
	Terminal       string `json:"terminal"`
	DepartamentoID int64  `json:"departamento_id"`
}