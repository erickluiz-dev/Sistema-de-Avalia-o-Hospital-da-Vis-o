package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"io"
	"strings"
)

// EncryptPhone protege o telefone com AES-256-GCM.
// O valor persistido tem o formato nonce || ciphertext+tag.
func EncryptPhone(phone string, key []byte) ([]byte, error) {
	if len(key) != 32 {
		return nil, errors.New("a chave de criptografia deve possuir 32 bytes")
	}
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil, nil
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, []byte(phone), nil), nil
}
