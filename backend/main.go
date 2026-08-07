package main

import (
	f "fmt"
	"net/http"
)

var nota1 = 0
var nota2 = 0
var nota3 = 0
var nota4 = 0
var nota5 = 0

func main() {
	http.HandleFunc("/nota1", incrementarNota1)
	http.HandleFunc("/nota2", incrementarNota2)
	http.HandleFunc("/nota3", incrementarNota3)
	http.HandleFunc("/nota4", incrementarNota4)
	http.HandleFunc("/nota5", incrementarNota5)

	f.Println("Servidor iniciado!")

	http.ListenAndServe(":8080", nil)

}

func incrementarNota1(w http.ResponseWriter, r *http.Request) {
	nota1++
	f.Println("Nota 1: ", nota1)
}

func incrementarNota2(w http.ResponseWriter, r *http.Request) {
	nota2++
	f.Println("Nota 2: ", nota2)
}

func incrementarNota3(w http.ResponseWriter, r *http.Request) {
	nota3++
	f.Println("Nota 3: ", nota3)
}

func incrementarNota4(w http.ResponseWriter, r *http.Request) {
	nota4++
	f.Println("Nota 4: ", nota4)
}

func incrementarNota5(w http.ResponseWriter, r *http.Request) {
	nota5++
	f.Println("Nota 5: ", nota5)
}
