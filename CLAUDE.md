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
- **GastosIA Auto** — controle de combustível, manutenção e plano de troca do carro.
  PWA num único `index.html` (HTML+CSS+JS inline) + `sw.js` + `manifest.json`, deploy
  na Vercel. Telas: Início, Combustível, Manutenção, Troca, Config.
- **Histórico:** até a v4.8.3 era o GastosIA de finanças pessoais (gastos, rendas,
  cartões, orçamento, relatório). Na v5.0.0 virou só carro, na mesma URL e com o mesmo
  login. O app antigo está no git (último commit dele: `f430e6e`).
- Pasta `ritmorec/` é um app separado (gravador de reunião) — não mexer salvo pedido.
- **Backend:** Supabase (projeto `vfrgmjhguzukraqsmduo`). Auth email/senha. Tabelas em
  uso: `veiculos`, `abastecimentos`, `manutencoes`, `planos_troca`. RLS endurecido: toda
  tabela exige `auth.uid() = user_id`. Supabase é a **fonte única** (não usar
  localStorage para dados do carro).
- **Tabelas legadas** `gastos`, `rendas`, `cartoes`, `faturas`, `categorias`: o app não
  lê nem escreve mais. Backup feito (pasta "Backup GastosIA - 2026-10-16" no Drive do
  dono) e o dono decidiu apagar. A coluna `gasto_id` em abastecimentos/manutenções é
  sobra do antigo espelho em `gastos` — texto sem FK, o app não grava mais.
- **IA:** chamada direta do browser à API Anthropic (`claude-haiku-4-5`) só para ler
  nota de posto e de oficina (vision). Chave em `localStorage` (`gastosIa_apiKey`, mesma
  chave do app antigo). Sem chave, tudo funciona digitando.
- **Compartilhar → app:** foto compartilhada pelo Android (share target do manifest)
  abre o modal de abastecimento e vai direto para a leitura da nota.

## Convenções
- **Versão:** bumpar JUNTOS a cada release o cache em `sw.js` (`const CACHE`) e os 4
  pontos em `index.html`: `<title>`, badge `.logo-version`, o "vX.X.X" no subtítulo da
  página Config e `var APP_VERSAO`. Produção só atualiza com merge na `main`.
- **XSS:** todo dado de usuário/IA renderizado via `innerHTML` passa por `esc()`;
  valores em atributos `onclick="fn('...')"` usam `escJs()`. Já existem no arquivo.
- **Datas:** usar `normalizeDateString()` / `parseExpenseDate()`; datas gravadas são
  texto `YYYY-MM-DD`.
- **Gravações:** todo botão que faz `insert` passa por `semDuploToque(chave, botaoId,
  fn)` e confere o `error` do Supabase antes de dizer "salvo". Sem isso o toque repetido
  com rede lenta duplicava registros (aconteceu: 5 cópias da mesma troca de óleo).
- **Km e custo/km:** km rodado vem dos abastecimentos, medido entre tanques cheios
  (`calcularMetricasVeiculo`). Custo/km de manutenção rateia sobre esses mesmos km.
  `kmAtualVeiculo()` = maior odômetro entre abastecimentos e manutenções.
- **Re-render:** depois de gravar, chamar `renderTelaVeiculo()`, que redesenha a tela
  aberta (não assumir qual é).
- **Scan de nota:** a data é sempre forçada para hoje (OCR de data era ruim); usuário
  ajusta manual. A IA não extrai mais data.
- **SQL destrutivo:** `delete`/`restore` pelo MCP do Supabase é bloqueado neste ambiente.
  Preparar o SQL (com backup antes) e o dono roda no SQL Editor.

## Fluxo de trabalho
- Branch de dev: `claude/fervent-babbage-nl2veu`. Commitar, push, abrir PR (não-draft),
  e fazer merge squash na `main` quando o dono aprova.
- Validar antes de commitar: `node --check sw.js` e checar sintaxe dos blocos `<script>`
  do `index.html`. Quando dá, testar headless com Playwright (stub do supabase global).

## Decisões de produto já tomadas
- **Sem manual de usuário extenso** (ROI baixo, desatualiza rápido). Preferir **dicas
  contextuais curtas nas telas vazias / no momento de uso**. Manual longo só se o
  objetivo for distribuir o app para terceiros.
- **App só de carro (out/2026):** sem renda, sem orçamento, sem gastos gerais. Por isso
  o plano de troca não tem mais o bloco "cabe no orçamento?" — mostra quanto guardar
  por mês e a simulação, e o dono julga.
- **Mesma URL do antigo:** escolhido para o PWA instalado virar o app novo sem
  reinstalar nem refazer login.
