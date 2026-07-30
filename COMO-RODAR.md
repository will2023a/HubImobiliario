# 🚀 Como Rodar - Gestor Pro 360

## Opção 1: Docker Compose (Recomendado)

Tudo roda com um único comando. Inclui MySQL, Redis, MinIO, Backend e Frontend.

### Pré-requisitos
- Docker e Docker Compose instalados

### Subir tudo
```bash
# Na raiz do projeto
docker compose up -d
```

### URLs de acesso
| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:1234 | Interface do sistema |
| Backend API | http://localhost:2000 | API REST + WebSocket |
| MinIO Console | http://localhost:9001 | Storage de arquivos |
| MySQL | localhost:3306 | Banco de dados |
| Redis | localhost:6379 | Cache + Pub/Sub |

### Primeira vez (popular banco)
```bash
# Rodar migrations e seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

### Credenciais padrão
| Usuário | E-mail | Senha | Role |
|---------|--------|-------|------|
| Super Admin | super@crm.com | super123 | super_admin |
| Admin Imobiliária | admin@imob1.com | 123456 | admin_imobiliaria |

### Comandos úteis
```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Prisma Studio (visualizar banco)
docker compose exec backend npx prisma studio

# Reiniciar um serviço
docker compose restart backend

# Parar tudo
docker compose down

# Parar e limpar volumes (reset total)
docker compose down -v
```

### Variáveis de ambiente
Edite o arquivo `.env` na raiz para configurar:
- Portas dos serviços
- Credenciais do banco
- JWT Secret
- MinIO credentials

---

## Opção 2: Desenvolvimento Local (sem Docker)

### Pré-requisitos
- Node.js 18+
- MySQL 8 rodando localmente
- Redis (opcional, para WebSocket scaling)

### Setup
```bash
# 1. Backend
cd backend
cp .env.example .env
# Editar .env: trocar mysql host para localhost
# DATABASE_URL="mysql://root:root@localhost:3306/crm_imobiliario"

npm install
npx prisma migrate dev
npm run seed
npm run dev

# 2. Frontend (outro terminal)
cd frontend
npm install
npm start
```

### Portas padrão
- Frontend: http://localhost:1234
- Backend: http://localhost:2000 (mapeado pela porta no docker-compose, ou 3000 se local direto)

---

## Estrutura de Portas

| Serviço | Porta Container | Porta Host |
|---------|----------------|------------|
| MySQL | 3306 | 3306 |
| Redis | 6379 | 6379 |
| MinIO API | 9000 | 9000 |
| MinIO Console | 9001 | 9001 |
| Backend | 3000 | 2000 |
| Frontend | 1234 | 1234 |

> O backend roda na porta 3000 internamente no container, mas é exposto na porta 2000 no host.
> O frontend se comunica com `http://localhost:2000` (configurável via `REACT_APP_API_URL`).
