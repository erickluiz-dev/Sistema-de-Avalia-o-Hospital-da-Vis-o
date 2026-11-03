-- Adiciona armazenamento criptografado do telefone.
ALTER TABLE avaliacoes
ADD COLUMN IF NOT EXISTS telefone_encrypted BYTEA;

COMMENT ON COLUMN avaliacoes.telefone_encrypted IS
'Telefone do paciente criptografado com AES-256-GCM.';