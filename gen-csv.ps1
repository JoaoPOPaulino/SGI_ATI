$csv = "Nome,Patrimonio,Numero Serie,Marca,Modelo,Categoria,Tipo,Condicao,Predio,Andar,Setor,Sala`n"
for ($i = 1; $i -le 100; $i++) {
    $csv += "Monitor Dell 24 - $($i.ToString('000'))" + "," +
            "PAT-$($i.ToString('000000'))" + "," +
            "SN-DELL-$($i.ToString('0000'))" + "," +
            "Dell" + "," +
            "P2422H" + "," +
            "MONITOR" + "," +
            "PATRIMONIADO" + "," +
            "NOVO" + "," +
            "Bloco A" + "," +
            "3 Andar" + "," +
            "TI" + "," +
            "302" + "`n"
}
Set-Content -Path "test-100-monitores.csv" -Value $csv -Encoding UTF8
Write-Output "Arquivo criado com $(($csv -split "`n").Count - 1) linhas"
