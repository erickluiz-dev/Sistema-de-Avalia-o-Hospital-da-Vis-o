package main

import (
	f "fmt"
	"net/http"
	"time"
)

var id = 0

type Avaliacoes struct {
	Id        int
	Avaliacao string
	Data      time.Time
}

var array []Avaliacoes

func main() {
	http.HandleFunc("/pessimo", incrementarPessimo)
	http.HandleFunc("/ruim", incrementarRuim)
	http.HandleFunc("/razoavel", incrementarRazoavel)
	http.HandleFunc("/bom", incrementarBom)
	http.HandleFunc("/excelente", incrementarExcelente)

	f.Println("Servidor iniciado!")

	http.ListenAndServe(":8080", nil)

}

func incrementarPessimo(w http.ResponseWriter, r *http.Request) {
	id++
	save := Avaliacoes{Id: id, Avaliacao: "Péssimo", Data: time.Now()}

	array = append(array, save)
	f.Println(array)
}

func incrementarRuim(w http.ResponseWriter, r *http.Request) {
	id++
	save := Avaliacoes{Id: id, Avaliacao: "Ruim", Data: time.Now()}

	array = append(array, save)
}

func incrementarRazoavel(w http.ResponseWriter, r *http.Request) {
	id++
	save := Avaliacoes{Id: id, Avaliacao: "Razoável", Data: time.Now()}

	array = append(array, save)
}

func incrementarBom(w http.ResponseWriter, r *http.Request) {
	id++
	save := Avaliacoes{Id: id, Avaliacao: "Bom", Data: time.Now()}

	array = append(array, save)
}

func incrementarExcelente(w http.ResponseWriter, r *http.Request) {
	id++
	save := Avaliacoes{Id: id, Avaliacao: "Excelente", Data: time.Now()}

	array = append(array, save)
}
