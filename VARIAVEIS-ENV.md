# 🔧 Configuração de Variáveis de Ambiente

## ✅ Backend - Configuração Permanente

### Arquivo: `backend/.env`

```env
DATABASE_URL="mysql://root:root@localhost:3306/crm_imobiliario"
JWT_SECRET=super_secret_jwt_key
NODE_ENV=development
PORT=2000
```

### Como Funciona

O backend **SEMPRE** vai usar essas variáveis:

1. `PORT` - Define a porta do servidor (atualmente: **2000**)
2. `DATABASE_URL` - Conexão com MySQL
3. `JWT_SECRET` - Chave para gerar tokens
4. `NODE_ENV` - Ambiente (development/production)

### Para Mudar a Porta do Backend

Basta editar o arquivo `backend/.env`:

```env
PORT=3000  # ou qualquer porta que quiser
```

E reiniciar o servidor:
```bash
cd backend
npm run dev
```

---

## ✅ Frontend - Configuração Permanente

### Arquivo: `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:2000
```

### Como Funciona

O frontend **SEMPRE** vai usar essa URL para fazer requisições à API:

- Se você mudar a porta do backend para `3000`, mude aqui também:
  ```env
  REACT_APP_API_URL=http://localhost:3000
  ```

### Para Mudar a URL da API

1. Edite `frontend/.env`
2. Reinicie o frontend:
   ```bash
   cd frontend
   npm start
   ```

---

## 🔄 Sincronização Backend ↔ Frontend

### Regra de Ouro

**A porta do backend no `.env` deve ser a MESMA que a URL do frontend!**

✅ **Correto:**
```
backend/.env:  PORT=2000
frontend/.env: REACT_APP_API_URL=http://localhost:2000
```

❌ **Errado (não vai funcionar):**
```
backend/.env:  PORT=2000
frontend/.env: REACT_APP_API_URL=http://localhost:3000  ⚠️ Porta diferente!
```

---

## 📋 Checklist de Configuração

### Primeira Vez

- [x] Backend tem `.env` configurado
- [x] Frontend tem `.env` configurado
- [x] Portas estão sincronizadas (2000)
- [x] `dotenv` está sendo carregado no `app.js`
- [x] `api.js` usa `process.env.REACT_APP_API_URL`

### Mudança de Porta

Quando quiser mudar a porta:

1. ✏️ Edite `backend/.env` → `PORT=NOVA_PORTA`
2. ✏️ Edite `frontend/.env` → `REACT_APP_API_URL=http://localhost:NOVA_PORTA`
3. 🔄 Reinicie backend (`npm run dev`)
4. 🔄 Reinicie frontend (`npm start`)

---

## 🎯 Configuração Atual

### Backend
- **Porta:** 2000
- **API:** http://localhost:2000
- **CORS:** Habilitado para todas as origens

### Frontend
- **Porta:** 1234 (Parcel)
- **API URL:** http://localhost:2000
- **Hot Reload:** Ativo

### Comunicação
```
Frontend (1234) → API Request → Backend (2000)
                ← API Response ←
```

---

## 🚀 Comandos para Iniciar

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Saída esperada:
```
🚀 ============================================
   CRM Imobiliário - Backend Iniciado
🚀 ============================================
📡 API rodando em: http://localhost:2000
📊 Prisma Studio: npx prisma studio
✅ Pronto para receber requisições!
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```
Saída esperada:
```
Server running at http://localhost:1234
✨ Built in 77ms
```

---

## 🔍 Verificação

### Testar Backend
```bash
curl http://localhost:2000
```
Deve retornar:
```json
{"ok":true,"message":"CRM Imobiliário API"}
```

### Testar Frontend
Abra o navegador em: http://localhost:1234

---

## 🛠️ Troubleshooting

### ❌ Frontend não conecta no backend

**Verificar:**
1. Backend está rodando? (`npm run dev` no terminal)
2. Porta do backend é 2000? (verifique no terminal de saída)
3. URL do frontend está correta? (verifique `frontend/.env`)

**Console do navegador (F12):**
```
GET http://localhost:2000/empreendimentos
```

Se aparecer erro de CORS ou Network Error, o backend não está rodando ou a porta está errada.

---

## 📝 Notas Importantes

1. **Parcel e Variáveis de Ambiente:**
   - Parcel só reconhece variáveis que começam com `REACT_APP_`
   - Exemplo: ✅ `REACT_APP_API_URL` | ❌ `API_URL`

2. **Mudanças no .env:**
   - Sempre reinicie o servidor após mudar `.env`
   - As variáveis são carregadas no início da aplicação

3. **Produção:**
   - Em produção, use URLs reais (não localhost)
   - Exemplo: `REACT_APP_API_URL=https://api.seudominio.com`

4. **.env no Git:**
   - Nunca commite o `.env` no Git!
   - Use `.env.example` para documentar as variáveis necessárias
