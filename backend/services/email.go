package services

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
)

type EmailService struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

func NewEmailService(
	host string,
	port string,
	username string,
	password string,
	from string,
) *EmailService {
	return &EmailService{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		From:     from,
	}
}

func (e *EmailService) EnviarRecuperacaoSenha(
	destinatario string,
	link string,
) error {

	if e.Host == "" ||
		e.Port == "" ||
		e.Username == "" ||
		e.Password == "" ||
		e.From == "" {
		return fmt.Errorf("configuração SMTP incompleta")
	}

	endereco := net.JoinHostPort(e.Host, e.Port)

	// Conexão TCP normal.
	// A porta 587 utiliza STARTTLS.
	conn, err := net.Dial("tcp", endereco)
	if err != nil {
		return fmt.Errorf(
			"erro ao conectar ao servidor SMTP: %w",
			err,
		)
	}

	client, err := smtp.NewClient(conn, e.Host)
	if err != nil {
		conn.Close()

		return fmt.Errorf(
			"erro ao criar cliente SMTP: %w",
			err,
		)
	}

	defer client.Close()

	// Configuração TLS para STARTTLS.
	tlsConfig := &tls.Config{
		ServerName: e.Host,
		MinVersion: tls.VersionTLS12,
	}

	// Ativa STARTTLS.
	if ok, _ := client.Extension("STARTTLS"); !ok {
		return fmt.Errorf(
			"servidor SMTP não suporta STARTTLS",
		)
	}

	if err := client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf(
			"erro ao iniciar STARTTLS: %w",
			err,
		)
	}

	// Autenticação.
	auth := smtp.PlainAuth(
		"",
		e.Username,
		e.Password,
		e.Host,
	)

	if err := client.Auth(auth); err != nil {
		return fmt.Errorf(
			"erro na autenticação SMTP: %w",
			err,
		)
	}

	// Define remetente.
	if err := client.Mail(e.From); err != nil {
		return fmt.Errorf(
			"erro ao definir remetente SMTP: %w",
			err,
		)
	}

	// Define destinatário.
	if err := client.Rcpt(destinatario); err != nil {
		return fmt.Errorf(
			"erro ao definir destinatário SMTP: %w",
			err,
		)
	}

	// Inicia envio da mensagem.
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf(
			"erro ao iniciar envio SMTP: %w",
			err,
		)
	}

	mensagem := fmt.Sprintf(
		"To: %s\r\n"+
			"From: %s\r\n"+
			"Subject: Recuperação de senha - Hospital da Visão\r\n"+
			"Content-Type: text/plain; charset=UTF-8\r\n"+
			"\r\n"+
			"Olá!\r\n"+
			"\r\n"+
			"Recebemos uma solicitação para redefinir sua senha.\r\n"+
			"\r\n"+
			"Acesse o link abaixo para criar uma nova senha:\r\n"+
			"%s\r\n"+
			"\r\n"+
			"Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.\r\n"+
			"\r\n"+
			"Se você não solicitou a recuperação da senha, ignore este e-mail.\r\n"+
			"\r\n"+
			"Hospital da Visão",
		destinatario,
		e.From,
		link,
	)

	if _, err := writer.Write([]byte(mensagem)); err != nil {
		writer.Close()

		return fmt.Errorf(
			"erro ao escrever mensagem SMTP: %w",
			err,
		)
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf(
			"erro ao finalizar mensagem SMTP: %w",
			err,
		)
	}

	if err := client.Quit(); err != nil {
		return fmt.Errorf(
			"erro ao encerrar conexão SMTP: %w",
			err,
		)
	}

	fmt.Println(
		"E-mail de recuperação enviado com sucesso para:",
		destinatario,
	)

	return nil
}