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
- Pasta `gastosia-auto/` é o **GastosIA Auto**, app separado só de carro (combustível,
  manutenção, plano de troca). Publicado junto com o GastosIA, em `/gastosia-auto/` no
  mesmo domínio (um projeto próprio na Vercel, como o `meetrec`, é opcional). No mesmo
  domínio ele compartilha a sessão do Supabase e a chave de IA, porque localStorage é por
  origem: quem entrou no GastosIA abre o Auto já logado. Usa só `veiculos`,
  `abastecimentos`, `manutencoes` e `planos_troca`.
- **Não recolocar `"trailingSlash": false` no `vercel.json` da raiz.** A Vercel tira a
  barra de `/gastosia-auto/`, os caminhos relativos do Auto passam a resolver na raiz e
  o "Instalar app" instala o GastosIA no lugar do Auto (aconteceu na v1.0.0). Versão própria (começou em 1.0.0): bumpar o cache em
  `gastosia-auto/sw.js` e os 4 pontos do `gastosia-auto/index.html` (`<title>`,
  `.logo-version`, subtítulo da página Config, `var APP_VERSAO`). Caminhos são relativos
  ao escopo (manifest, SW, ícones) — não trocar por `/...`, senão numa subpasta ele pega
  o SW e o manifest do GastosIA.
- **Os dois apps escrevem nas tabelas de carro, mas só o GastosIA espelha em `gastos`.**
  O que é lançado no Auto não aparece nos gastos/relatório do GastosIA. Foi escolha
  (o Auto nasceu sem o espelho); religar é decisão do dono.
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
- **Gravações:** botão que faz `insert` passa por `semDuploToque(chave, botaoId, fn)` e
  confere o `error` do Supabase antes de dizer "salvo". Sem isso o toque repetido com rede
  lenta duplicava registros (aconteceu: 5 cópias da mesma troca de óleo).
- **SQL destrutivo:** `delete`/`restore` pelo MCP do Supabase é bloqueado neste ambiente.
  Preparar o SQL (com backup antes) e o dono roda no SQL Editor.
- **Não apagar `gastos`/`rendas`/`cartoes`:** chegou a ser decidido quando o plano era
  transformar o GastosIA no app de carro; com dois apps, o GastosIA continua usando.

## Fluxo de trabalho
- Branch de dev: `claude/fervent-babbage-nl2veu`. Commitar, push, abrir PR (não-draft),
  e fazer merge squash na `main` quando o dono aprova.
- Validar antes de commitar: `node --check sw.js` e checar sintaxe dos blocos `<script>`
  do `index.html`. Quando dá, testar headless com Playwright (stub do supabase global).

## Decisões de produto já tomadas
- **Sem manual de usuário extenso** (ROI baixo, desatualiza rápido). Preferir **dicas
  contextuais curtas nas telas vazias / no momento de uso**. Manual longo só se o
  objetivo for distribuir o app para terceiros.
- **Login fica:** o dono pediu para tirar a senha e decidiu manter o login depois de ver o
  risco (a chave do Supabase é pública no código; RLS + login é o que protege os dados).
  O incômodo se resolve com sessão persistente — entra uma vez por aparelho.
