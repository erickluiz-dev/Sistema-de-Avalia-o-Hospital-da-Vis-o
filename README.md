# Sistema de Avaliação — Hospital da Visão

Sistema web para registro e análise de avaliações de satisfação dos pacientes e avaliação dos funcinarios do Hospital da Visão.

## Tecnologias

### Backend
```
- Go
- net/http
- PostgreSQL
- pgx/v5
```
### Frontend
```
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
```
## Estrutura
```text
.
├── backend/
├── frontend/
└── README.md
```

## 🔐 HTTPS no ambiente local
```
O backend utiliza cookies de sessão com a flag `Secure=true`. Por segurança, esses cookies **só são enviados pelo navegador através de conexões HTTPS**.

Por esse motivo, o ambiente de desenvolvimento local deve utilizar HTTPS.
```
### Requisito
```
Ao executar o sistema localmente, o backend deve ser acessado através de:

https://localhost:8080
```
