BEGIN;

ALTER TABLE sessoes
ADD COLUMN token_hash CHAR(64);

UPDATE sessoes
SET token_hash = encode(
    digest(id::text, 'sha256'),
    'hex'
);

ALTER TABLE sessoes
ALTER COLUMN token_hash SET NOT NULL;

ALTER TABLE sessoes
ADD CONSTRAINT sessoes_token_hash_unique
UNIQUE (token_hash);

COMMIT;
⚠️ Atenção

Essa migration usa:

digest()

que pertence à extensão pgcrypto.

Portanto, se pgcrypto ainda não estiver habilitada, a migration precisa começar com:

CREATE EXTENSION IF NOT EXISTS pgcrypto;

Nesse caso, use:

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE sessoes
ADD COLUMN token_hash CHAR(64);

UPDATE sessoes
SET token_hash = encode(
    digest(id::text, 'sha256'),
    'hex'
);

ALTER TABLE sessoes
ALTER COLUMN token_hash SET NOT NULL;

ALTER TABLE sessoes
ADD CONSTRAINT sessoes_token_hash_unique
UNIQUE (token_hash);

COMMIT;