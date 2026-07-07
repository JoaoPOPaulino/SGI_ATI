# SGI-ATI: Inicialização Docker

# 1. Iniciar containers
echo "Iniciando PostgreSQL..."
docker compose up -d postgres

echo "Aguardando PostgreSQL..."
until docker compose exec postgres pg_isready -U sgi_user -d sgi_ati 2>/dev/null; do
  echo "  Aguardando..."
  sleep 2
done

echo "PostgreSQL pronto!"
echo ""
echo "Verificando tabelas:"
docker compose exec postgres psql -U sgi_user -d sgi_ati -c "\dt"

echo ""
echo "Verificando usuarios:"
docker compose exec postgres psql -U sgi_user -d sgi_ati -c "SELECT nome, email, cpf, perfil FROM public.usuarios;"

echo ""
echo "Banco pronto! Backend: http://localhost:3001"
