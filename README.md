# Casher

Sistema profissional de gerenciamento de sorteios com painel administrativo e aplicação para operadores.

## Funcionalidades

- **Painel Administrativo**: Gerenciamento completo de sorteios, rifas e notificações
- **Aplicação para Operadores**: Interface para contato com ganhadores via WhatsApp
- **Autenticação**: PIN para admin, usuário/senha para operadores
- **Rate Limiting**: Proteção contra tentativas de acesso não autorizado
- **Importação em Lote**: Carregamento de tickets via arquivo de texto
- **Banco de Dados**: Supabase PostgreSQL com migrations automáticas

## Variáveis de Ambiente

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
SESSION_SECRET=seu-segredo-aqui
ADMIN_PIN_HASH=hash-do-seu-pin
```

## Desenvolvimento Local

```bash
npm install
npm run dev
# Acesse http://localhost:3000/setup para configurar
```

## Deploy no Render

1. Crie um novo Web Service no [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente (use `/setup` em produção pra gerar hashes)
4. Deploy automático em cada push para `main`

## Estrutura

```
app/
  setup/          # Configuração inicial e migrations
  admin/          # Painel administrativo
  ligador/        # Aplicação para operadores
components/ui/   # Design system
lib/             # Lógica compartilhada
supabase/        # Migrations e schema
```

## Tecnologia

- Next.js 16 (App Router + Turbopack)
- Tailwind CSS v4
- Supabase (PostgreSQL + RLS)
- TypeScript
