# 🚀 GUIA RÁPIDO - Como Rodar o Sistema

## ✅ Resposta Rápida: SIM, eles já vão se comunicar!

**Não precisa fazer build!** Use os comandos de desenvolvimento:

### 1️⃣ Iniciar Backend (Terminal 1)

```bash
cd backend
npm run dev
```

✅ Backend estará rodando em: `http://localhost:3000`

### 2️⃣ Iniciar Frontend (Terminal 2)

```bash
cd frontend
npm start
```

✅ Frontend estará rodando em: `http://localhost:1234`

---

## 📡 Comunicação Backend ↔ Frontend

### Configuração Atual

- **Backend**: Porta `3000` (com CORS habilitado)
- **Frontend**: Porta `1234` (Parcel dev server)
- **Axios**: Configurado para `http://localhost:3000`

### Como Funciona

1. Frontend faz requisições via Axios
2. Axios envia para `http://localhost:3000` (backend)
3. Backend responde com CORS habilitado
4. Axios intercepta e adiciona token JWT automaticamente
5. Dados são exibidos no frontend

### Arquivo de Configuração

📄 `/frontend/src/services/api.js`:
```javascript
baseURL: 'http://localhost:3000'
```

---

## 🗄️ Configurar Banco de Dados (ANTES de rodar)

### 1. Configure o .env

```bash
cd backend
nano .env  # ou use seu editor preferido
```

Adicione:
```env
DATABASE_URL="mysql://root:senha@localhost:3306/crm_imobiliario"
JWT_SECRET="sua_chave_secreta_super_segura_12345"
NODE_ENV="development"
PORT=3000
```

### 2. Execute as Migrations

```bash
npx prisma migrate dev --name init
```

### 3. Popule com Dados de Teste

```bash
npm run seed
```

---

## 🎯 Fluxo Completo de Inicialização

### PRIMEIRA VEZ (Setup Inicial)

```bash
# 1. Backend - Instalar e Configurar
cd backend
npm install
# Configure o .env com suas credenciais MySQL
npx prisma migrate dev --name init
npm run seed

# 2. Frontend - Instalar
cd ../frontend
npm install
```

### PRÓXIMAS VEZES (Desenvolvimento)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (nova aba/janela)
cd frontend
npm start
```

---

## 🧪 Testar Comunicação

### 1. Abra o navegador em `http://localhost:1234`

### 2. Faça login com uma das contas:

- **Admin Imobiliária**: `admin@imob1.com` / `123456`
- **Diretor**: `diretor@imob1.com` / `123456`
- **Gerente**: `gerente1@imob1.com` / `123456`
- **Corretor**: `corretor1@imob1.com` / `123456`

### 3. Verifique as requisições no console do navegador (F12)

Você verá requisições como:
- `POST http://localhost:3000/auth/login` (Login)
- `GET http://localhost:3000/empreendimentos` (Listar empreendimentos)

### 4. Verifique logs no terminal do backend

Você verá logs do Morgan:
```
POST /auth/login 200 45ms
GET /empreendimentos 200 12ms
```

---

## 🔧 Troubleshooting

### ❌ Erro: "Network Error" ou "CORS"

**Causa**: Backend não está rodando ou CORS não configurado

**Solução**:
```bash
cd backend
npm run dev  # Certifique-se que o backend está rodando
```

### ❌ Erro: "Cannot connect to database"

**Causa**: MySQL não está rodando ou credenciais erradas no .env

**Solução**:
```bash
# 1. Verifique se MySQL está rodando
sudo systemctl status mysql

# 2. Inicie se necessário
sudo systemctl start mysql

# 3. Verifique credenciais no .env
cd backend
cat .env
```

### ❌ Erro: "Port 3000 already in use"

**Causa**: Outra aplicação usando a porta

**Solução**:
```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 <PID>

# OU mudar porta no .env
PORT=3001
```

### ❌ Erro: "Token inválido" ao fazer requisições

**Causa**: Token JWT expirado ou inválido

**Solução**:
```bash
# No navegador (F12 > Console)
localStorage.clear()
location.reload()
```

---

## 📦 Quando Fazer Build?

### Desenvolvimento (NOW)
❌ **NÃO precisa build**
✅ Use `npm run dev` (backend) e `npm start` (frontend)

### Produção (FUTURO)
✅ **Precisa build**

```bash
# Frontend - Gera arquivos estáticos otimizados
cd frontend
npm run build
# Arquivos em: frontend/dist/

# Backend - Só precisa das dependências de produção
cd backend
npm install --production
NODE_ENV=production node src/server.js
```

---

## 🎨 Estrutura de Portas

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| Backend API | 3000 | http://localhost:3000 | Express + Prisma |
| Frontend | 1234 | http://localhost:1234 | React + Parcel |
| Prisma Studio | 5555 | http://localhost:5555 | Interface visual DB |
| MySQL | 3306 | localhost:3306 | Banco de dados |

---

## ✨ Comandos Úteis

```bash
# Ver banco de dados visualmente
cd backend
npx prisma studio  # Abre em http://localhost:5555

# Resetar banco (apaga tudo e recria)
npx prisma migrate reset --force
npm run seed

# Ver logs detalhados
cd backend
npm run dev  # Morgan mostra todas as requisições

# Testar API diretamente (sem frontend)
curl http://localhost:3000
# Deve retornar: {"ok":true,"message":"CRM Imobiliário API"}
```

---

## 🎯 Resumo Final

### Para Desenvolvimento (AGORA):

1. ✅ Configure `.env` do backend
2. ✅ Rode migrations: `npx prisma migrate dev`
3. ✅ Popule banco: `npm run seed`
4. ✅ Inicie backend: `npm run dev` (porta 3000)
5. ✅ Inicie frontend: `npm start` (porta 1234)
6. ✅ Acesse: http://localhost:1234
7. ✅ Faça login e use o sistema!

### Build só é necessário para:
- ❌ Não é necessário agora
- ✅ Deploy em produção (servidor real)
- ✅ Criar arquivos estáticos otimizados

---

**💡 Dica**: Deixe os dois terminais abertos (backend + frontend). Qualquer mudança no código será refletida automaticamente graças ao Nodemon (backend) e Parcel HMR (frontend)!
