# Personal Finance Hub

Um sistema completo de gestão financeira pessoal, 100% autônomo e seguro.

## 🚀 Features

- ✅ Autenticação local segura (bcrypt + JWT)
- ✅ Banco de dados SQLite local (sem servidor externo necessário)
- ✅ Dashboard com visão geral financeira
- ✅ Gestão de contas, transações e investimentos
- ✅ Categorização de despesas
- ✅ Gráficos e estatísticas
- ✅ Responsivo e moderno

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone <seu-repo>
cd personal-finance-hub
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e altere o `JWT_SECRET` para uma string aleatória segura:
```env
JWT_SECRET=sua-chave-super-secreta-aqui-min-32-caracteres
```

4. **Inicialize o banco de dados**
```bash
npm run db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**

Abra seu navegador em: `http://localhost:3000`

## 🔐 Primeiro Acesso

1. Acesse `/register` para criar sua conta
2. Faça login com suas credenciais
3. O sistema criará automaticamente dados de exemplo para você começar

## 📂 Estrutura do Projeto

```
personal-finance-hub/
├── client/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── components/  # Componentes reutilizáveis
│   │   └── lib/         # Utilitários
├── server/              # Backend (Express + tRPC)
│   ├── _core/           # Core do servidor
│   ├── db.ts            # Queries do banco de dados
│   └── routers.ts       # Rotas da API
├── drizzle/             # Schema do banco de dados
├── data/                # Banco de dados SQLite (criado automaticamente)
└── package.json
```

## 🏗️ Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Compila para produção
npm run start    # Inicia o servidor de produção
npm run db:push  # Atualiza o schema do banco de dados
npm run check    # Verifica tipos TypeScript
npm run format   # Formata o código
npm test         # Roda os testes
```

## 🚢 Deploy

### Opção 1: Railway (Recomendado)

1. Crie uma conta em [Railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Railway detectará automaticamente e fará o deploy
4. Adicione as variáveis de ambiente no painel do Railway

### Opção 2: Render

1. Crie uma conta em [Render.com](https://render.com)
2. Crie um novo Web Service
3. Conecte seu repositório
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Adicione as variáveis de ambiente

### Opção 3: Docker

```bash
# Build
docker build -t personal-finance-hub .

# Run
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/data:/app/data \
  personal-finance-hub
```

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ JWT com expiração de 1 ano
- ✅ Cookies HttpOnly e Secure
- ✅ CSRF protection via cookies
- ✅ Validação de entrada com Zod
- ✅ Banco de dados local (seus dados não saem do seu controle)

## 🛠️ Tecnologias

**Frontend:**
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Recharts
- Wouter (routing)
- tRPC React Query

**Backend:**
- Node.js
- Express
- tRPC
- Drizzle ORM
- SQLite
- bcryptjs
- jose (JWT)

## 📝 Licença

MIT

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças importantes, abra uma issue primeiro para discutir o que você gostaria de mudar.

## 💡 Roadmap

- [ ] Importação de CSV
- [ ] Exportação para Excel/PDF
- [ ] Gráficos de evolução temporal
- [ ] Sistema de metas financeiras
- [ ] Multi-empresa
- [ ] PWA (installable app)
- [ ] Modo escuro
- [ ] Notificações
