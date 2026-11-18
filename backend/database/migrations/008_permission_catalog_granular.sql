-- 008_permission_catalog_granular.sql
-- Atualiza o catálogo para acesso a módulos e ações granulares de gerenciamento.
-- Reexecutável e sem apagar dados de usuários.

INSERT INTO permissoes (codigo, tema, nome, descricao) VALUES
 ('gerenciamento.acessar','Gerenciamento','Acessar gerenciamento','Abrir o módulo de gerenciamento'),
 ('gerenciamento.departamentos.criar','Gerenciamento','Criar departamentos','Cadastrar novos departamentos'),
 ('gerenciamento.departamentos.excluir','Gerenciamento','Apagar departamentos','Desativar departamentos existentes'),
 ('gerenciamento.terminais.criar','Gerenciamento','Criar terminais','Cadastrar novos terminais'),
 ('gerenciamento.terminais.excluir','Gerenciamento','Apagar terminais','Desativar terminais existentes'),
 ('gerenciamento.funcionarios.criar','Gerenciamento','Criar funcionários','Cadastrar novos funcionários'),
 ('gerenciamento.funcionarios.editar','Gerenciamento','Editar funcionários','Alterar dados e vínculos de funcionários'),
 ('gerenciamento.funcionarios.excluir','Gerenciamento','Apagar funcionários','Desativar funcionários existentes'),
 ('gerenciamento.usuarios.criar','Gerenciamento','Criar usuários','Cadastrar novos usuários'),
 ('gerenciamento.usuarios.editar','Gerenciamento','Editar usuários','Alterar dados de usuários'),
 ('gerenciamento.usuarios.excluir','Gerenciamento','Apagar usuários','Desativar usuários existentes'),
 ('permissoes.acessar','Permissões','Acessar permissões','Abrir o módulo de permissões')
ON CONFLICT (codigo) DO UPDATE SET
 tema=EXCLUDED.tema, nome=EXCLUDED.nome, descricao=EXCLUDED.descricao;

-- Concessões antigas de gerenciamento passam a permitir somente entrar no módulo.
INSERT INTO funcao_permissoes (funcao_id, permissao_id, permitido)
SELECT DISTINCT fp.funcao_id, novo.id, fp.permitido
FROM funcao_permissoes fp
JOIN permissoes antigo ON antigo.id=fp.permissao_id
JOIN permissoes novo ON novo.codigo='gerenciamento.acessar'
WHERE antigo.codigo IN ('gerenciamento.usuarios','gerenciamento.funcionarios','gerenciamento.departamentos','gerenciamento.terminais')
ON CONFLICT (funcao_id, permissao_id) DO NOTHING;

INSERT INTO usuario_permissoes (usuario_id, permissao_id, permitido)
SELECT DISTINCT up.usuario_id, novo.id, up.permitido
FROM usuario_permissoes up
JOIN permissoes antigo ON antigo.id=up.permissao_id
JOIN permissoes novo ON novo.codigo='gerenciamento.acessar'
WHERE antigo.codigo IN ('gerenciamento.usuarios','gerenciamento.funcionarios','gerenciamento.departamentos','gerenciamento.terminais')
ON CONFLICT (usuario_id, permissao_id) DO NOTHING;

-- Migra a antiga permissão de visualização para Acessar permissões.
INSERT INTO funcao_permissoes (funcao_id, permissao_id, permitido)
SELECT fp.funcao_id, novo.id, fp.permitido
FROM funcao_permissoes fp
JOIN permissoes antigo ON antigo.id=fp.permissao_id AND antigo.codigo='permissoes.visualizar'
JOIN permissoes novo ON novo.codigo='permissoes.acessar'
ON CONFLICT (funcao_id, permissao_id) DO NOTHING;
INSERT INTO usuario_permissoes (usuario_id, permissao_id, permitido)
SELECT up.usuario_id, novo.id, up.permitido
FROM usuario_permissoes up
JOIN permissoes antigo ON antigo.id=up.permissao_id AND antigo.codigo='permissoes.visualizar'
JOIN permissoes novo ON novo.codigo='permissoes.acessar'
ON CONFLICT (usuario_id, permissao_id) DO NOTHING;

-- Administradores mantêm acesso integral.
INSERT INTO funcao_permissoes (funcao_id, permissao_id, permitido)
SELECT f.id, p.id, TRUE FROM funcoes f CROSS JOIN permissoes p
WHERE f.codigo='administrador'
ON CONFLICT (funcao_id, permissao_id) DO UPDATE SET permitido=TRUE;

-- Remove do catálogo as permissões antigas e abrangentes após migrar concessões.
DELETE FROM usuario_permissoes WHERE permissao_id IN (
 SELECT id FROM permissoes WHERE codigo IN ('gerenciamento.usuarios','gerenciamento.funcionarios','gerenciamento.departamentos','gerenciamento.terminais','permissoes.visualizar')
);
DELETE FROM funcao_permissoes WHERE permissao_id IN (
 SELECT id FROM permissoes WHERE codigo IN ('gerenciamento.usuarios','gerenciamento.funcionarios','gerenciamento.departamentos','gerenciamento.terminais','permissoes.visualizar')
);
DELETE FROM permissoes WHERE codigo IN ('gerenciamento.usuarios','gerenciamento.funcionarios','gerenciamento.departamentos','gerenciamento.terminais','permissoes.visualizar');
