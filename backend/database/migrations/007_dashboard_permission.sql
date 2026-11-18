-- 007_dashboard_permission.sql
-- Permite conceder acesso ao Painel Administrativo sem conceder perfil Administrador.
-- Seguro para execução repetida e não altera registros existentes.

INSERT INTO permissoes (codigo, tema, nome, descricao)
VALUES (
    'painel.visualizar',
    'Painel Administrativo',
    'Visualizar painel administrativo',
    'Acessar o painel administrativo e seus indicadores'
)
ON CONFLICT (codigo) DO UPDATE
SET tema = EXCLUDED.tema,
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao;

-- Administradores continuam com acesso total, inclusive à nova permissão.
INSERT INTO funcao_permissoes (funcao_id, permissao_id, permitido)
SELECT f.id, p.id, TRUE
FROM funcoes f
CROSS JOIN permissoes p
WHERE f.codigo = 'administrador'
  AND p.codigo = 'painel.visualizar'
ON CONFLICT (funcao_id, permissao_id) DO UPDATE
SET permitido = TRUE;
