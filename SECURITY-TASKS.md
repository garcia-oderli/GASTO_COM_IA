# Segurança — Tarefas antes de colocar à venda

## 🔴 Prioridade 1 — RLS no Supabase
**Problema:** Se Row Level Security não está ativo nas tabelas `gastos` e `rendas`,
qualquer usuário logado pode ler dados de outros usuários.

**O que fazer:**
- Acessar Supabase Dashboard → Table Editor → `gastos` → RLS
- Ativar RLS e adicionar policy: `auth.uid() = user_id` para SELECT, INSERT, UPDATE, DELETE
- Repetir para tabela `rendas` e `cartoes`
- Testar com 2 usuários diferentes para confirmar isolamento

**Estimativa:** 30 min

---

## 🔴 Prioridade 2 — Sanitizar innerHTML
**Problema:** Vários trechos do app usam `el.innerHTML = ...` com dados vindos do banco
(ex: nome do gasto, descrição). Se alguém salvar `<script>alert(1)</script>` num campo,
executa no browser de outro usuário (XSS).

**O que fazer:**
- Criar função `sanitize(str)` que usa `textContent` ou escapa `<`, `>`, `"`, `'`, `&`
- Substituir todos os usos de dados do usuário dentro de `innerHTML` pela função sanitize
- Focar nos campos: `descricao`, `categoria`, `valor`, `data`

**Estimativa:** 2h

---

## 🔴 Prioridade 3 — Mover chave Anthropic para Edge Function
**Problema:** O usuário coloca a chave `sk-ant-...` no app e ela fica salva no `localStorage`
do browser. Se houver XSS ou acesso físico ao computador, a chave vaza.

**O que fazer:**
- Criar uma Supabase Edge Function `analyze-receipt` que recebe a imagem em base64
- A Edge Function chama a API da Anthropic com a chave guardada como secret no Supabase
- O app chama a Edge Function em vez de chamar a Anthropic diretamente
- Remover o campo de API key do app (usuário não precisa mais fornecer chave)

**Estimativa:** 4h

---

## Status
- [ ] RLS no Supabase
- [ ] Sanitizar innerHTML
- [ ] Edge Function para chave Anthropic
