CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    usado_em TIMESTAMP NULL,

    CONSTRAINT fk_password_reset_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_usuario_id
    ON password_reset_tokens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expira_em
    ON password_reset_tokens(expira_em);