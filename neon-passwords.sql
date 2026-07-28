-- ============================================================
-- SGI-ATI: Atualizar senhas dos usuarios no Neon
-- Rode este script no SQL Editor do Neon apos criar as tabelas
-- ============================================================

UPDATE public.usuarios SET senha_hash = '$2b$10$q7SDnDvK.7vrbrb9Pb6lJ.YvMo9xtQKeUlI8PRCJ0YbdwH1TrIgQu' WHERE cpf = '00000000000';
-- adm00 -> 000@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$BdbI6y9FWeqEceFycCS8fuKGNSjVzmVR5xWq923YEQ28DcSV6tDsS' WHERE cpf = '11111111111';
-- Pettrus -> 111@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$2n7Un9FCJ/OEjkcLQJsgc.2flkgFsIaCx7IZ9VUjLZCojK9XUNUci' WHERE cpf = '22222222222';
-- Alcides -> 222@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$3tN1z3uUOk6u8B60IDnVQeyYJd1m/RGcay.mORFAZCHjO0YF9m.4a' WHERE cpf = '33333333333';
-- Joao -> 333@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$NJ3sYQOgGURg7PN.NGafEutEsFbfoQe1DaUdr2rXGNZFHwlcfC59y' WHERE cpf = '44444444444';
-- Gilberto -> 444@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$drNU36oHjmNJsWdtpA5RvulHCjSxvtf5k22MHQbngEex5Kg5aPAC6' WHERE cpf = '55555555555';
-- Marsall -> 555@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$x6sgXO8mdwbNLwe5BT1e/uhCjd.3Ghdem3Eu/UsH38WQ9goWhcImG' WHERE cpf = '66666666666';
-- Luiz -> 666@ati
UPDATE public.usuarios SET senha_hash = '$2b$10$ka8yZbiU8VCjcJCGIZ5cQOWHvBWCigqFgTTFshDXfF3pOcqGCU7UO' WHERE cpf = '77777777777';
-- Alex -> 777@ati
