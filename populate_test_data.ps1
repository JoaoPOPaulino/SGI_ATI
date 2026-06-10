# Test Data Generator - SGI ATI
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA"
$headers = @{"apikey"=$key; "Authorization"="Bearer $key"; "Content-Type"="application/json"; "Prefer"="return=representation"}
$base = "https://hpprmuxpawtjgyvsiyeb.supabase.co/rest/v1"

# Get real user IDs
$usuarios = Invoke-RestMethod -Uri "$base/usuarios?select=id,nome,perfil" -Headers $headers
$adminId = ($usuarios | Where-Object {$_.perfil -eq 'ADMIN'})[0].id
$adminNome = ($usuarios | Where-Object {$_.perfil -eq 'ADMIN'})[0].nome
Write-Host "Admin: $adminNome ($adminId)"

# ============================================================
# 1. CREATE 100 ITEMS
# ============================================================
Write-Host "`nCriando 100 itens..."

$tipos = @('PATRIMONIADO','PATRIMONIADO','PATRIMONIADO','SERIALIZADO','NAO_SERIALIZADO')
$categorias = @('Computador','Notebook','Monitor','Impressora','Teclado','Mouse','Cadeira','Mesa','Roteador','Switch','Telefone','Tablet','Scanner','Projetor','Estabilizador','Nobreak','Hub USB','Webcam','Headset','Caixa de Som')
$condicoes = @('NOVO','BOM','BOM','BOM','REGULAR','REGULAR','RUIM')
$statuses = @('ATIVO','ATIVO','ATIVO','ATIVO','ATIVO','ATIVO','GUARDADO','GUARDADO','EM_MANUTENCAO','EMPRESTADO')
$marcas = @('Dell','HP','Lenovo','Samsung','LG','Logitech','Microsoft','Intelbras','TP-Link','Epson')
$polos = @('GSM','GSM','GSM','Laboratório')
$locais = @(
  @{polo='GSM';predio='Bloco A';andar='3 Andar';setor='Tecnologia';sala='Sala 302';estacao='A-10'},
  @{polo='GSM';predio='Bloco A';andar='3 Andar';setor='Tecnologia';sala='Sala 303';estacao='B-05'},
  @{polo='GSM';predio='Bloco A';andar='2 Andar';setor='Administrativo';sala='Sala 201';estacao='C-01'},
  @{polo='GSM';predio='Anexo I';andar='Terreo';setor='Atendimento';sala='Recepcao';estacao='R-01'},
  @{polo='Laboratorio';predio='Bloco B';andar='1 Andar';setor='Infraestrutura';sala='Laboratorio';estacao='B-01'}
)

$itens = @()
for ($i = 1; $i -le 100; $i++) {
    $tipo = $tipos | Get-Random
    $cat = $categorias | Get-Random
    $cond = $condicoes | Get-Random
    $status = $statuses | Get-Random
    $marca = $marcas | Get-Random
    $loc = $locais | Get-Random
    $polo = $loc.polo
    
    $pat = if ($tipo -eq 'PATRIMONIADO') { "PAT-{0:D5}" -f ($i + 1000) } else { $null }
    $serie = if ($tipo -ne 'NAO_SERIALIZADO') { "SN-{0:D8}" -f (Get-Random -Min 10000000 -Max 99999999) } else { $null }
    $qtd = if ($tipo -eq 'NAO_SERIALIZADO') { Get-Random -Min 1 -Max 50 } else { 1 }
    
    $item = @{
        nome = "$marca $cat $(Get-Random -Min 1000 -Max 9999)"
        tipo = $tipo
        categoria = $cat
        condicao = $cond
        status = $status
        numero_patrimonio = $pat
        numero_serie = $serie
        localizacao_atual = "$($loc.predio) - $($loc.andar) - $($loc.sala) - $($loc.estacao)"
        polo = $loc.polo
        predio = $loc.predio
        andar = $loc.andar
        setor = $loc.setor
        sala = $loc.sala
        estacao = $loc.estacao
        marca = $marca
        modelo = "Modelo-$(Get-Random -Min 100 -Max 999)"
        quantidade = $qtd
        created_at = (Get-Date).ToString('o')
        updated_at = (Get-Date).ToString('o')
    }
    
    $result = Invoke-RestMethod -Uri "$base/itens" -Method Post -Headers $headers -Body ($item | ConvertTo-Json -Depth 5)
    $itens += $result
    if ($i % 20 -eq 0) { Write-Host "  $i itens criados..." }
}
Write-Host "100 itens criados!"

# Categorize items for different test scenarios
$ativos = $itens | Where-Object { $_.status -eq 'ATIVO' }
$guardados = $itens | Where-Object { $_.status -eq 'GUARDADO' }
$manutencao = $itens | Where-Object { $_.status -eq 'EM_MANUTENCAO' }
$emprestados = $itens | Where-Object { $_.status -eq 'EMPRESTADO' }

# ============================================================
# 2. CREATE MOVEMENTS (30+ movements)
# ============================================================
Write-Host "`nCriando movimentacoes..."
$now = (Get-Date).ToString('o')

# Transfers between locations
for ($i = 0; $i -lt 15; $i++) {
    $item = $ativos[$i % $ativos.Count]
    $destino = $locais | Get-Random
    $mov = @{
        item_id = $item.id; item_nome = $item.nome
        tipo = 'TRANSFERENCIA'; origem = $item.localizacao_atual
        destino = "$($destino.predio) - $($destino.andar) - $($destino.sala) - $($destino.estacao)"
        solicitante_id = $adminId; solicitante_nome = $adminNome
        aprovador_id = $adminId; aprovador_nome = $adminNome
        status_aprovacao = 'APROVADO'; data_movimentacao = (Get-Date).AddDays(-$i).ToString('o')
        observacao = "Transferencia de setor - teste #$i"
        tipo_documento = 'GUIA_MOVIMENTACAO'
        signature_token = "sha256-test-$i"
        created_at = $now
    }
    Invoke-RestMethod -Uri "$base/movimentacoes" -Method Post -Headers $headers -Body ($mov | ConvertToJson -Depth 3) | Out-Null
}

# Check-outs (loans/events)
for ($i = 0; $i -lt 5; $i++) {
    $item = $guardados[$i % $guardados.Count]
    $mov = @{
        item_id = $item.id; item_nome = $item.nome
        tipo = 'CHECK_OUT'; origem = $item.localizacao_atual
        destino = 'Almoxarifado Central (Emprestimo)'
        solicitante_id = $adminId; solicitante_nome = $adminNome
        aprovador_id = $adminId; aprovador_nome = $adminNome
        status_aprovacao = 'APROVADO'; data_movimentacao = (Get-Date).AddDays(-$i).ToString('o')
        observacao = "Check-out emprestimo #$i"
        tipo_documento = 'CONTROLE_ENTRADA_SAIDA'
        signature_token = "sha256-co-$i"
        created_at = $now
    }
    Invoke-RestMethod -Uri "$base/movimentacoes" -Method Post -Headers $headers -Body ($mov | ConvertToJson -Depth 3) | Out-Null
}

# Check-ins (returns)
for ($i = 0; $i -lt 5; $i++) {
    $item = $ativos[$i]
    $mov = @{
        item_id = $item.id; item_nome = $item.nome
        tipo = 'CHECK_IN'; origem = 'Almoxarifado Central'
        destino = $item.localizacao_atual
        solicitante_id = $adminId; solicitante_nome = $adminNome
        aprovador_id = $adminId; aprovador_nome = $adminNome
        status_aprovacao = 'APROVADO'; data_movimentacao = (Get-Date).AddDays(-$i).ToString('o')
        observacao = "Devolucao item #$i"
        tipo_documento = 'CONTROLE_ENTRADA_SAIDA'
        signature_token = "sha256-ci-$i"
        created_at = $now
    }
    Invoke-RestMethod -Uri "$base/movimentacoes" -Method Post -Headers $headers -Body ($mov | ConvertToJson -Depth 3) | Out-Null
}

# Maintenance entries
for ($i = 0; $i -lt 5; $i++) {
    $item = $manutencao[$i % $manutencao.Count]
    if (-not $item) { $item = $ativos[$i] }
    $mov = @{
        item_id = $item.id; item_nome = $item.nome
        tipo = 'MANUTENCAO'; origem = $item.localizacao_atual
        destino = 'Laboratorio (Em Manutencao)'
        solicitante_id = $adminId; solicitante_nome = $adminNome
        aprovador_id = $adminId; aprovador_nome = $adminNome
        status_aprovacao = 'APROVADO'; data_movimentacao = (Get-Date).AddDays(-$i).ToString('o')
        observacao = "Envio para manutencao #$i - defeito na tela"
        tipo_documento = 'GUIA_MOVIMENTACAO'
        signature_token = "sha256-man-$i"
        created_at = $now
    }
    Invoke-RestMethod -Uri "$base/movimentacoes" -Method Post -Headers $headers -Body ($mov | ConvertToJson -Depth 3) | Out-Null
}

# Decommission requests (BAIXA - PENDENTE)
for ($i = 0; $i -lt 3; $i++) {
    $item = $ativos[$i + 20]
    $mov = @{
        item_id = $item.id; item_nome = $item.nome
        tipo = 'BAIXA'; origem = $item.localizacao_atual
        destino = 'Deposito de Sucata / Descarte'
        solicitante_id = $adminId; solicitante_nome = $adminNome
        status_aprovacao = 'PENDENTE'; data_movimentacao = (Get-Date).AddDays(-$i).ToString('o')
        observacao = "Solicitacao de baixa #$i - equipamento obsoleto"
        created_at = $now
    }
    Invoke-RestMethod -Uri "$base/movimentacoes" -Method Post -Headers $headers -Body ($mov | ConvertToJson -Depth 3) | Out-Null
}

Write-Host "33 movimentacoes criadas!"

# ============================================================
# 3. CREATE LOANS (8 emprestimos)
# ============================================================
Write-Host "`nCriando emprestimos..."
for ($i = 0; $i -lt 5; $i++) {
    $item = $ativos[$i + 30]
    $loan = @{
        item_id = $item.id; item_nome = $item.nome
        responsavel = $adminNome
        data_retorno_prevista = (Get-Date).AddDays(7 + $i).ToString('yyyy-MM-dd')
        status = 'ATIVO'
        created_at = $now
    }
    Invoke-RestMethod -Uri "$base/loans" -Method Post -Headers $headers -Body ($loan | ConvertToJson -Depth 3) | Out-Null
}
# Some returned loans
for ($i = 0; $i -lt 3; $i++) {
    $item = $ativos[$i + 40]
    $loan = @{
        item_id = $item.id; item_nome = $item.nome
        responsavel = $adminNome
        data_retorno_prevista = (Get-Date).AddDays(-(3 + $i)).ToString('yyyy-MM-dd')
        status = 'DEVOLVIDO'
        created_at = (Get-Date).AddDays(-(10 + $i)).ToString('o')
    }
    Invoke-RestMethod -Uri "$base/loans" -Method Post -Headers $headers -Body ($loan | ConvertToJson -Depth 3) | Out-Null
}
Write-Host "8 emprestimos criados!"

# ============================================================
# 4. CREATE EVENTS (5 events)
# ============================================================
Write-Host "`nCriando eventos..."
# Active events with allocated items
for ($i = 0; $i -lt 3; $i++) {
    $evtItens = @($ativos[$i + 50].id, $ativos[$i + 51].id, $ativos[$i + 52].id)
    $evento = @{
        nome = @('Workshop Tecnologia','Treinamento Equipe','Palestra Inovacao','Feira de Ciencia','Seminario TI')[$i]
        data_inicio = (Get-Date).AddDays(1 + $i).ToString('yyyy-MM-dd') + 'T08:00:00Z'
        data_fim = (Get-Date).AddDays(3 + $i).ToString('yyyy-MM-dd') + 'T18:00:00Z'
        local = 'Auditorio Principal'
        responsavel_id = $adminId
        itens_alocados = $evtItens
    }
    Invoke-RestMethod -Uri "$base/eventos" -Method Post -Headers $headers -Body ($evento | ConvertToJson -Depth 3) | Out-Null
}

# Expired events (for cleanup testing)
for ($i = 0; $i -lt 2; $i++) {
    $evtItens = @($ativos[$i + 60].id, $ativos[$i + 61].id)
    $evento = @{
        nome = @('Evento Encerrado A','Evento Encerrado B')[$i]
        data_inicio = (Get-Date).AddDays(-10).ToString('yyyy-MM-dd') + 'T08:00:00Z'
        data_fim = (Get-Date).AddDays(-5).ToString('yyyy-MM-dd') + 'T18:00:00Z'
        local = 'Auditorio Principal'
        responsavel_id = $adminId
        itens_alocados = $evtItens
    }
    Invoke-RestMethod -Uri "$base/eventos" -Method Post -Headers $headers -Body ($evento | ConvertToJson -Depth 3) | Out-Null
}
Write-Host "5 eventos criados!"

# ============================================================
# 5. CREATE LAUDOS (8 laudos tecnicos)
# ============================================================
Write-Host "`nCriando laudos tecnicos..."
$statusServico = @('EM_ANALISE','AGUARDANDO_PECA','EM_REPARO','FINALIZADO','FINALIZADO')
for ($i = 0; $i -lt 8; $i++) {
    $item = $manutencao[$i % $manutencao.Count]
    if (-not $item) { $item = $ativos[$i + 70] }
    $sts = $statusServico | Get-Random
    $laudo = @{
        item_id = $item.id; item_nome = $item.nome
        tecnico_id = $adminId; tecnico_nome = $adminNome
        descricao_problema = "Equipamento apresentando $(@('tela azul','superaquecimento','nao liga','lentidao','barulho estranho','teclas travadas','conexao intermitente','fonte queimada')[$i])"
        diagnostico = $(@('Placa mae com defeito','Cooler obstruido','Fonte danificada','HD com setores defeituosos','Ventoinha emperrada','Membrana do teclado gasta','Placa de rede oxidada','Capacitor estourado')[$i])
        acao_realizada = $(@('Substituicao da placa mae','Limpeza e troca do cooler','Troca da fonte','Substituicao do HD por SSD','Lubrificacao da ventoinha','Troca do teclado','Limpeza dos contatos','Troca do capacitor')[$i])
        pecas_utilizadas = $(@('Placa mae Dell','Cooler Master','Fonte 500W','SSD 240GB','Oleo lubrificante','Teclado padrao','Alcool isopropilico','Capacitor 1000uF')[$i])
        status_servico = $sts
        created_at = (Get-Date).AddDays(-$i).ToString('o')
    }
    Invoke-RestMethod -Uri "$base/laudos" -Method Post -Headers $headers -Body ($laudo | ConvertToJson -Depth 3) | Out-Null
}
Write-Host "8 laudos criados!"

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n========================================"
Write-Host " BANCO POPULADO COM SUCESSO!"
Write-Host "========================================"
Write-Host " Itens:          100"
Write-Host " Movimentacoes:  33 (15 transf + 5 out + 5 in + 5 manut + 3 baixa)"
Write-Host " Emprestimos:    8 (5 ativos + 3 devolvidos)"
Write-Host " Eventos:        5 (3 ativos + 2 expirados)"
Write-Host " Laudos:         8"
Write-Host "========================================"
