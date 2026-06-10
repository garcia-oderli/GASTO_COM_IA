# GASTO_COM_IA — notas para o assistente

## Como o dono quer que eu trabalhe
- **Não puxar saco.** Nada de "boa ideia", "excelente", elogio à toa. Se a ideia tem
  problema, eu questiono e proponho algo melhor antes de executar — mesmo quando o
  pedido já veio pronto. Foi exatamente isso que o dono valorizou: melhorar/contestar
  o que ele disse em vez de só concordar.
- **Pode contrapor as ideias dele.** O dono autorizou explicitamente discordar e propor
  alternativas. Não tratar os pedidos como ordens intocáveis — se houver caminho melhor,
  dizer com franqueza e recomendar, antes de sair fazendo.
- Resposta direta, em português. Recomendação clara em vez de lista de opções neutras.

## Projeto
- App de finanças pessoais **GastosIA**, PWA num único `index.html` (HTML+CSS+JS inline)
  + `sw.js` (service worker) + `manifest.json`, deploy na Vercel.
- Pasta `ritmorec/` é um app separado (gravador de reunião) — não mexer salvo pedido.
- **Backend:** Supabase (projeto `vfrgmjhguzukraqsmduo`). Auth email/senha; tabelas
  `gastos`, `rendas`, `cartoes`, `faturas`. RLS já endurecido: toda tabela exige
  `auth.uid() = user_id`. Supabase é a **fonte única** dos dados (não usar localStorage
  para dados de gasto/renda).
- **IA:** chamadas diretas do browser à API Anthropic (`claude-haiku-4-5`) para scan de
  nota (vision), análise consultor e import de PDF. Chave fica em `localStorage`
  (`gastosIa_apiKey`). Fallback local sem chave.

## Convenções
- **Versão:** bumpar JUNTOS a cada release o cache em `sw.js` (`const CACHE`) e os 3
  pontos visíveis em `index.html`: `<title>`, badge `.logo-version` e o "vX.X.X" em
  Config → Sobre. Produção só atualiza quando faz merge na `main` (Vercel auto-deploy).
- **XSS:** todo dado de usuário/IA renderizado via `innerHTML` passa por `esc()`;
  valores em atributos `onclick="fn('...')"` usam `escJs()`. Já existem no arquivo.
- **Datas:** usar `parseExpenseDate()` em todo o app. Exceção proposital: módulo de
  cartões usa `new Date(data+'T00:00:00')` por causa das bordas de ciclo (meia-noite).
- **Escopo de período:** Início, Gastos, Análise e Relatório contam o **mês atual**
  (`getMonthExpenses`). Manter consistente entre telas.
- **Scan de nota:** a data é sempre forçada para hoje (OCR de data era ruim); usuário
  ajusta manual. A IA não extrai mais data.

## Fluxo de trabalho
- Branch de dev: `claude/fervent-babbage-nl2veu`. Commitar, push, abrir PR (não-draft),
  e fazer merge squash na `main` quando o dono aprova.
- Validar antes de commitar: `node --check sw.js` e checar sintaxe dos blocos `<script>`
  do `index.html`. Quando dá, testar headless com Playwright (stub do supabase global).

## Decisões de produto já tomadas
- **Sem manual de usuário extenso** (ROI baixo, desatualiza rápido). Preferir **dicas
  contextuais curtas nas telas vazias / no momento de uso**. Manual longo só se o
  objetivo for distribuir o app para terceiros.
