-- ============================================================
-- SGI-ATI: Dados Iniciais (Seed)
-- Senhas: {3primeirosDigitosCPF}@ati
-- Em producao, usar bcrypt no backend para gerar os hashes
-- ============================================================

-- Senha padrao para todos: 000@ati (so para seed/dev)
-- Hash bcrypt de '000@ati' (custo 10):
-- $2b$10$placeholder - gere com bcrypt no backend

INSERT INTO public.usuarios (id, nome, email, cpf, perfil, ativo, polo, primeiro_acesso) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'adm00',  'admin@ati.com',    '00000000000', 'ADMIN',       true, 'GSM',          false),
  ('a0000000-0000-0000-0000-000000000002', 'Pettrus','pettrus@ati.com',  '11111111111', 'ESTAGIARIO',  true, 'GSM',          true),
  ('a0000000-0000-0000-0000-000000000003', 'Alcides','alcides@ati.com',  '22222222222', 'TECNICO',     true, 'GSM',          true),
  ('a0000000-0000-0000-0000-000000000004', 'João',   'joao@ati.com',     '33333333333', 'SUPERVISOR',  true, 'GSM',          true),
  ('a0000000-0000-0000-0000-000000000005', 'Gilberto','gilberto@ati.com','44444444444', 'TECNICO',     true, 'Laboratório', true),
  ('a0000000-0000-0000-0000-000000000006', 'Marsall', 'marsall@ati.com', '55555555555', 'SUPERVISOR',  true, 'GSM',          true),
  ('a0000000-0000-0000-0000-000000000007', 'Luiz',    'luiz@ati.com',    '66666666666', 'ESTAGIARIO',  true, 'Laboratório', true),
  ('a0000000-0000-0000-0000-000000000008', 'Alex',    'alex@ati.com',    '77777777777', 'TECNICO',     true, 'GSM',          true)
ON CONFLICT (id) DO NOTHING;

-- Locais de exemplo
INSERT INTO public.locais (id, polo, predio, andar, setor, sala, estacao) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'GSM',        'Bloco A',  '3 Andar', 'Tecnologia da Informacao', 'Sala 302',     'Estacao A-10'),
  ('b0000000-0000-0000-0000-000000000002', 'Laboratório','Bloco B',  '1 Andar', 'Infraestrutura',           'Laboratorio',  'Bancada B-1'),
  ('b0000000-0000-0000-0000-000000000003', 'GSM',        'Anexo I',  'Térreo',  'Atendimento',              'Recepcao',     'Estacao R-1'),
  ('b0000000-0000-0000-0000-000000000004', 'GSM',        'Bloco A',  '5 Andar', 'Financeiro',               'Sala 501',     'Estacao F-01'),
  ('b0000000-0000-0000-0000-000000000005', 'GSM',        'Bloco A',  '2 Andar', 'Recursos Humanos',         'Sala 201',     'Estacao RH-1'),
  ('b0000000-0000-0000-0000-000000000006', 'Laboratório','Bloco B',  '2 Andar', 'Pesquisa',                 'Sala P-01',    'Bancada P-1'),
  ('b0000000-0000-0000-0000-000000000007', 'Laboratório','Bloco B',  'Térreo',  'Manutencao',               'Oficina',      'Bancada M-1'),
  ('b0000000-0000-0000-0000-000000000008', 'GSM',        'Bloco A',  '7 Andar', 'Diretoria',                'Sala 701',     'Estacao D-01')
ON CONFLICT (id) DO NOTHING;
