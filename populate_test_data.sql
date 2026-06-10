-- Populate test data via SQL
-- Run this in Supabase SQL Editor

-- Get admin user ID
DO $$
DECLARE
  admin_id UUID;
  admin_nome TEXT;
  item_record RECORD;
  i INT;
BEGIN
  SELECT id, nome INTO admin_id, admin_nome FROM public.usuarios WHERE perfil = 'ADMIN' AND ativo = true LIMIT 1;

  -- Clean existing test data
  DELETE FROM public.movimentacoes;
  DELETE FROM public.evento_itens;
  DELETE FROM public.laudos;
  DELETE FROM public.loans;
  DELETE FROM public.eventos;
  DELETE FROM public.itens;

  -- 1. CREATE 100 ITEMS
  FOR i IN 1..100 LOOP
    INSERT INTO public.itens (nome, tipo, categoria, condicao, status, 
      numero_patrimonio, numero_serie, localizacao_atual, polo, predio, andar, setor, sala, estacao,
      marca, modelo, quantidade)
    VALUES (
      CASE (i % 20)
        WHEN 1 THEN 'Dell Optiplex ' || (7000 + i)
        WHEN 2 THEN 'HP EliteBook ' || (800 + i)
        WHEN 3 THEN 'Lenovo ThinkPad ' || (400 + i)
        WHEN 4 THEN 'Monitor Samsung ' || (20 + i) || '"'
        WHEN 5 THEN 'Impressora HP LaserJet ' || (100 + i)
        WHEN 6 THEN 'Teclado Logitech K' || (100 + i)
        WHEN 7 THEN 'Mouse Microsoft ' || (3000 + i)
        WHEN 8 THEN 'Cadeira Giratoria ' || (100 + i)
        WHEN 9 THEN 'Mesa Escritorio ' || (200 + i)
        WHEN 10 THEN 'Roteador TP-Link ' || (900 + i)
        WHEN 11 THEN 'Switch Intelbras ' || (100 + i)
        WHEN 12 THEN 'Telefone VoIP ' || (200 + i)
        WHEN 13 THEN 'Tablet Samsung ' || (500 + i)
        WHEN 14 THEN 'Projetor Epson ' || (300 + i)
        WHEN 15 THEN 'Estabilizador ' || (100 + i)
        WHEN 16 THEN 'Nobreak APC ' || (600 + i)
        WHEN 17 THEN 'Hub USB ' || (100 + i)
        WHEN 18 THEN 'Webcam Logitech ' || (900 + i)
        WHEN 19 THEN 'Headset JBL ' || (200 + i)
        ELSE 'Caixa de Som ' || (100 + i)
      END,
      CASE WHEN i % 10 <= 7 THEN 'PATRIMONIADO' WHEN i % 10 <= 9 THEN 'SERIALIZADO' ELSE 'NAO_SERIALIZADO' END,
      CASE (i % 10)
        WHEN 1 THEN 'Computador' WHEN 2 THEN 'Notebook' WHEN 3 THEN 'Monitor'
        WHEN 4 THEN 'Impressora' WHEN 5 THEN 'Teclado' WHEN 6 THEN 'Mouse'
        WHEN 7 THEN 'Cadeira' WHEN 8 THEN 'Mesa' WHEN 9 THEN 'Roteador'
        ELSE 'Acessorio'
      END,
      CASE WHEN i % 7 = 0 THEN 'NOVO' WHEN i % 7 <= 3 THEN 'BOM' WHEN i % 7 <= 5 THEN 'REGULAR' ELSE 'RUIM' END,
      CASE 
        WHEN i <= 70 THEN 'ATIVO'
        WHEN i <= 80 THEN 'GUARDADO'
        WHEN i <= 85 THEN 'EM_MANUTENCAO'
        WHEN i <= 90 THEN 'EMPRESTADO'
        ELSE 'ATIVO'
      END,
      CASE WHEN i % 10 <= 7 THEN 'PAT-' || LPAD((i + 1000)::TEXT, 6, '0') ELSE NULL END,
      CASE WHEN i % 10 <= 8 THEN 'SN-' || LPAD((i * 137)::TEXT, 8, '0') ELSE NULL END,
      CASE (i % 5)
        WHEN 1 THEN 'Bloco A - 3 Andar - Sala 302 - Estacao A-10'
        WHEN 2 THEN 'Bloco A - 3 Andar - Sala 303 - Estacao B-05'
        WHEN 3 THEN 'Bloco A - 2 Andar - Sala 201 - Estacao C-01'
        WHEN 4 THEN 'Anexo I - Terreo - Recepcao - Estacao R-01'
        ELSE 'Bloco B - 1 Andar - Laboratorio - Bancada B-01'
      END,
      CASE WHEN i % 5 = 4 THEN 'Laboratorio' ELSE 'GSM' END,
      CASE WHEN i % 5 = 4 THEN 'Bloco B' WHEN i % 5 = 3 THEN 'Anexo I' ELSE 'Bloco A' END,
      CASE WHEN i % 5 = 4 THEN '1 Andar' WHEN i % 5 = 3 THEN 'Terreo' WHEN i % 5 = 2 THEN '2 Andar' ELSE '3 Andar' END,
      CASE WHEN i % 5 = 4 THEN 'Infraestrutura' WHEN i % 5 = 3 THEN 'Atendimento' WHEN i % 5 = 2 THEN 'Administrativo' ELSE 'Tecnologia' END,
      CASE WHEN i % 5 = 4 THEN 'Laboratorio' WHEN i % 5 = 3 THEN 'Recepcao' WHEN i % 5 = 2 THEN 'Sala 201' WHEN i % 5 = 1 THEN 'Sala 302' ELSE 'Sala 303' END,
      CASE WHEN i % 5 = 4 THEN 'B-01' WHEN i % 5 = 3 THEN 'R-01' WHEN i % 5 = 2 THEN 'C-01' WHEN i % 5 = 1 THEN 'A-10' ELSE 'B-05' END,
      CASE (i % 6) WHEN 1 THEN 'Dell' WHEN 2 THEN 'HP' WHEN 3 THEN 'Lenovo' WHEN 4 THEN 'Samsung' WHEN 5 THEN 'Logitech' ELSE 'Intelbras' END,
      'Modelo-' || (100 + i),
      CASE WHEN i % 10 = 9 THEN (i % 20) + 1 ELSE 1 END
    );
  END LOOP;

  -- 2. CREATE MOVEMENTS (30)
  FOR i IN 1..15 LOOP
    INSERT INTO public.movimentacoes (item_id, item_nome, tipo, origem, destino, 
      solicitante_id, solicitante_nome, aprovador_id, aprovador_nome, 
      status_aprovacao, data_movimentacao, observacao, tipo_documento, signature_token)
    SELECT id, nome, 'TRANSFERENCIA', localizacao_atual, 
      'Bloco A - 2 Andar - Sala 201 - Estacao C-01',
      admin_id, admin_nome, admin_id, admin_nome,
      'APROVADO', NOW() - (i || ' days')::INTERVAL,
      'Transferencia teste #' || i, 'GUIA_MOVIMENTACAO', 'sig-' || i
    FROM public.itens WHERE status = 'ATIVO' LIMIT 1 OFFSET i;
  END LOOP;

  FOR i IN 1..5 LOOP
    INSERT INTO public.movimentacoes (item_id, item_nome, tipo, origem, destino,
      solicitante_id, solicitante_nome, status_aprovacao, data_movimentacao, observacao)
    SELECT id, nome, 'CHECK_OUT', 'Almoxarifado', 'Sala Externa',
      admin_id, admin_nome, 'APROVADO', NOW() - (i || ' days')::INTERVAL, 'Checkout #' || i
    FROM public.itens WHERE status = 'GUARDADO' LIMIT 1 OFFSET i-1;
  END LOOP;

  FOR i IN 1..5 LOOP
    INSERT INTO public.movimentacoes (item_id, item_nome, tipo, origem, destino,
      solicitante_id, solicitante_nome, status_aprovacao, data_movimentacao, observacao)
    SELECT id, nome, 'CHECK_IN', 'Externo', 'Almoxarifado Central',
      admin_id, admin_nome, 'APROVADO', NOW() - (i || ' days')::INTERVAL, 'Devolucao #' || i
    FROM public.itens WHERE status = 'ATIVO' LIMIT 1 OFFSET (i+30);
  END LOOP;

  FOR i IN 1..5 LOOP
    INSERT INTO public.movimentacoes (item_id, item_nome, tipo, origem, destino,
      solicitante_id, solicitante_nome, status_aprovacao, data_movimentacao, observacao)
    SELECT id, nome, 'MANUTENCAO', localizacao_atual, 'Laboratorio (Em Manutencao)',
      admin_id, admin_nome, 'APROVADO', NOW() - (i || ' days')::INTERVAL, 'Manutencao #' || i
    FROM public.itens WHERE status = 'EM_MANUTENCAO' LIMIT 1 OFFSET i-1;
  END LOOP;

  FOR i IN 1..3 LOOP
    INSERT INTO public.movimentacoes (item_id, item_nome, tipo, origem, destino,
      solicitante_id, solicitante_nome, status_aprovacao, data_movimentacao, observacao)
    SELECT id, nome, 'BAIXA', localizacao_atual, 'Deposito de Sucata',
      admin_id, admin_nome, 'PENDENTE', NOW() - (i || ' days')::INTERVAL, 'Solicitacao baixa #' || i
    FROM public.itens WHERE status = 'ATIVO' LIMIT 1 OFFSET (i+50);
  END LOOP;

  -- 3. LOANS (8)
  FOR i IN 1..5 LOOP
    INSERT INTO public.loans (item_id, item_nome, responsavel, data_retorno_prevista, status)
    SELECT id, nome, admin_nome, NOW() + ((7+i) || ' days')::INTERVAL, 'ATIVO'
    FROM public.itens WHERE status = 'ATIVO' LIMIT 1 OFFSET (i+60);
  END LOOP;

  FOR i IN 1..3 LOOP
    INSERT INTO public.loans (item_id, item_nome, responsavel, data_retorno_prevista, status)
    SELECT id, nome, admin_nome, NOW() - '5 days'::INTERVAL, 'DEVOLVIDO'
    FROM public.itens WHERE status = 'ATIVO' LIMIT 1 OFFSET (i+70);
  END LOOP;

  -- 4. EVENTS (5)
  FOR i IN 1..3 LOOP
    WITH evt AS (
      INSERT INTO public.eventos (nome, data_inicio, data_fim, local, responsavel_id, itens_alocados)
      VALUES ('Workshop ' || i, NOW() + '2 days'::INTERVAL, NOW() + '4 days'::INTERVAL, 'Auditorio', admin_id, '[]'::jsonb)
      RETURNING id
    )
    INSERT INTO public.evento_itens (evento_id, item_id)
    SELECT evt.id, it.id FROM evt, public.itens it WHERE it.status = 'ATIVO' LIMIT 3;
  END LOOP;

  FOR i IN 1..2 LOOP
    INSERT INTO public.eventos (nome, data_inicio, data_fim, local, responsavel_id, itens_alocados)
    VALUES ('Evento Expirado ' || i, NOW() - '10 days'::INTERVAL, NOW() - '5 days'::INTERVAL, 'Auditorio', admin_id, '[]'::jsonb);
  END LOOP;

  -- 5. LAUDOS (8)
  FOR i IN 1..8 LOOP
    INSERT INTO public.laudos (item_id, item_nome, tecnico_id, tecnico_nome,
      descricao_problema, diagnostico, acao_realizada, pecas_utilizadas, status_servico)
    SELECT id, nome, admin_id, admin_nome,
      CASE i WHEN 1 THEN 'Tela azul intermitente' WHEN 2 THEN 'Superaquecimento' WHEN 3 THEN 'Nao liga'
             WHEN 4 THEN 'Lentidao extrema' WHEN 5 THEN 'Barulho na ventoinha' WHEN 6 THEN 'Teclas travadas'
             WHEN 7 THEN 'Conexao de rede instavel' ELSE 'Fonte queimada' END,
      CASE i WHEN 1 THEN 'Placa mae com defeito' WHEN 2 THEN 'Cooler obstruido' WHEN 3 THEN 'Fonte danificada'
             WHEN 4 THEN 'HD com setores defeituosos' WHEN 5 THEN 'Ventoinha desgastada' WHEN 6 THEN 'Membrana gasta'
             WHEN 7 THEN 'Placa de rede oxidada' ELSE 'Capacitor estourado' END,
      CASE i WHEN 1 THEN 'Troca da placa mae' WHEN 2 THEN 'Limpeza e troca do cooler' WHEN 3 THEN 'Troca da fonte'
             WHEN 4 THEN 'Substituicao por SSD' WHEN 5 THEN 'Lubrificacao' WHEN 6 THEN 'Troca do teclado'
             WHEN 7 THEN 'Limpeza dos contatos' ELSE 'Troca do capacitor' END,
      CASE i WHEN 1 THEN 'Placa mae Dell' WHEN 2 THEN 'Cooler Master' WHEN 3 THEN 'Fonte 500W'
             WHEN 4 THEN 'SSD 240GB' WHEN 5 THEN 'Oleo lubrificante' WHEN 6 THEN 'Teclado padrao'
             WHEN 7 THEN 'Alcool isopropilico' ELSE 'Capacitor 1000uF' END,
      CASE WHEN i <= 4 THEN 'FINALIZADO' WHEN i <= 6 THEN 'EM_REPARO' ELSE 'EM_ANALISE' END
    FROM public.itens WHERE status IN ('EM_MANUTENCAO','ATIVO') LIMIT 1 OFFSET (i-1);
  END LOOP;

END $$;

-- Verify
SELECT 'itens' as tabela, count(*) FROM public.itens
UNION ALL SELECT 'movimentacoes', count(*) FROM public.movimentacoes
UNION ALL SELECT 'loans', count(*) FROM public.loans
UNION ALL SELECT 'eventos', count(*) FROM public.eventos
UNION ALL SELECT 'laudos', count(*) FROM public.laudos;
