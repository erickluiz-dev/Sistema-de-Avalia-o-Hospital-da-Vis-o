-- 006_permissions.sql
-- Estrutura incremental: preserva usuarios.administrador e todos os registros existentes.
CREATE TABLE IF NOT EXISTS funcoes (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(40) NOT NULL UNIQUE,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissoes (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    tema VARCHAR(80) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS funcao_permissoes (
    funcao_id BIGINT NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
    permissao_id BIGINT NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
    permitido BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (funcao_id, permissao_id)
);

CREATE TABLE IF NOT EXISTS usuario_permissoes (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    permissao_id BIGINT NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
    permitido BOOLEAN NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, permissao_id)
);

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS funcao_id BIGINT REFERENCES funcoes(id);

INSERT INTO funcoes (nome, codigo) VALUES
    ('Administrador', 'administrador'),
    ('Atendente', 'atendente'),
    ('Funcionário', 'funcionario')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO permissoes (codigo, tema, nome, descricao) VALUES
 ('dashboard.visualizar','Dashboard','Visualizar Dashboard','Acessar indicadores gerais'),
 ('dashboard.estatisticas','Dashboard','Consultar estatísticas','Visualizar indicadores detalhados'),
 ('atendimento.computador','Computador do Atendente','Acessar computador do atendente','Operar a tela de atendimento'),
 ('atendimento.validar_dados','Computador do Atendente','Validar dados do paciente','Conferir e corrigir dados informados'),
 ('atendimento.liberar_avaliacao','Computador do Atendente','Liberar avaliação','Encaminhar paciente para avaliação'),
 ('tablet.acessar','Tablet do Paciente','Acessar tablet do paciente','Abrir interface de avaliação'),
 ('tablet.realizar_avaliacao','Tablet do Paciente','Realizar avaliação','Registrar resposta do paciente'),
 ('painel.consultar_avaliacoes','Painel Administrativo','Consultar avaliações','Consultar avaliações registradas'),
 ('painel.exportar_relatorios','Painel Administrativo','Exportar relatórios','Exportar relatórios administrativos'),
 ('gerenciamento.usuarios','Gerenciamento','Gerenciar usuários','Criar e administrar usuários'),
 ('gerenciamento.funcionarios','Gerenciamento','Gerenciar funcionários','Administrar funcionários'),
 ('gerenciamento.departamentos','Gerenciamento','Gerenciar departamentos','Administrar departamentos'),
 ('gerenciamento.terminais','Gerenciamento','Gerenciar terminais','Administrar terminais'),
 ('permissoes.visualizar','Permissões','Visualizar permissões','Consultar funções e permissões'),
 ('permissoes.alterar','Permissões','Alterar permissões','Modificar permissões de usuários'),
 ('academy.acessar','Academy','Acessar Academy','Consultar conteúdos de capacitação'),
 ('academy.gerenciar','Academy','Gerenciar Academy','Administrar conteúdos de capacitação')
ON CONFLICT (codigo) DO NOTHING;

-- Padrões iniciais: administrador possui tudo; atendente recebe recursos de atendimento;
-- funcionário começa sem permissões operacionais atribuídas. Permissões individuais podem sobrescrever.
INSERT INTO funcao_permissoes (funcao_id, permissao_id, permitido)
SELECT f.id, p.id, TRUE
FROM funcoes f CROSS JOIN permissoes p
WHERE f.codigo = 'administrador'
ON CONFLICT (funcao_id, permissao_id) DO NOTHING;

INSERT INTO funcao_permissoes (funcao_id, permissao_id, permitido)
SELECT f.id, p.id, TRUE
FROM funcoes f JOIN permissoes p
  ON p.codigo IN ('atendimento.computador','atendimento.validar_dados','atendimento.liberar_avaliacao')
WHERE f.codigo = 'atendente'
ON CONFLICT (funcao_id, permissao_id) DO NOTHING;

-- Compatibilidade: usuários que já eram administradores continuam administradores.
UPDATE usuarios
SET funcao_id = (SELECT id FROM funcoes WHERE codigo = 'administrador')
WHERE administrador = TRUE AND funcao_id IS NULL;

-- Usuários existentes não administradores recebem a função Funcionário como ponto de partida.
UPDATE usuarios
SET funcao_id = (SELECT id FROM funcoes WHERE codigo = 'funcionario')
WHERE administrador = FALSE AND funcao_id IS NULL;
