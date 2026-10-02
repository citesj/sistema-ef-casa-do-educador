# AGENTS — Instruções para LLMs e Agentes de Codificação

Formato: instruções técnicas para agentes (Copilot, Claude Code, Cursor, etc.) que irão analisar/editar/deployar este projeto.

## Visão rápida
- Tipo: Google Apps Script (bound script) + Google Sheets
- Gerenciamento local: `@google/clasp` com `rootDir: dist`
- Runtime: V8 (JavaScript moderno)
- scriptId: 13Ry7UNhKmaTpEAqD1p79AveDBe-HhIX75hTCT9AOieFDGT6ShM8o3QBm

## Arquivos permitidos e mapeamento
- Arquivos fonte usados pelo GAS: `.js`, `.gs`, `.html`, `.json` (manifest)
- `.clasp.json` controla: `scriptId`, `rootDir` (dist), extensões aceitas e ordem de push.
- `appsscript.json` contém `oauthScopes` e `runtimeVersion` (V8). Mantenha-o sincronizado com qualquer alteração que adicione novos scopes.

## Regras estritas (leia antes de qualquer alteração)
1. NUNCA editar código diretamente na IDE web do Apps Script sem executar `clasp pull` primeiro. Caso altere online, sempre sincronize (`clasp pull`) antes de `clasp push` para evitar conflitos.
2. Alterações locais devem passar pelo `build.js` (se impactam `dist/`). O fluxo de deploy é: `npm run build` → `clasp push` (via `npm run clasp:upload`).
3. Não insira blobs (imagens em base64) em documentação pública. Referencie os arquivos existentes (`_base64_constants.js`) em vez de colocar os dados binários.
4. Mantenha `appsscript.json` atualizado quando adicionar OAuth scopes.

## Mapeamento semântico: abas, ranges e handlers
- Abas (nomes exatos referenciados no código):
  - DADOS — alterações de status monitoradas por `processarStatusFrequencia` (COLUNAS_STATUS)
  - LISTA FREQUÊNCIA — geração de PDF via `createAttendancePdf()` e processamento de filtros via `processarListaFrequencia`
  - CERTIFICADO — `generateCsv()` espera campos: B1 (grupo), B2 (periodo inicial), B3 (periodo final) e linhas de dados a partir da linha 5.
  - RELATORIO — `createRelatorioFaltasPdf()` lê metadados em B2 (período), B3 (unidade), B4 (dataEnvio) e dados a partir da linha 7.

- Ranges/intervalos explícitos observados:
  - LISTA FREQUÊNCIA: CELULAS `{ GRUPO: "E1", UNIDADE: "E2", FUNCAO: "E3" }`
  - processarListaFrequencia: linha de filtros nas linhas 1..3; `INTERVALO_DEPENDENTES: 'E2:E3'`
  - processarStatusFrequencia: `PRIMEIRA_LINHA_DADOS: 2`, `COLUNAS_STATUS` contém colunas 6,8,10,... (pares específicos até 70)
  - generateCsv: linha inicial = 5, colunas 1..5, variáveis em B1/B2/B3
  - createRelatorioFaltasPdf: START_ROW = 7, START_COL = 1, NUM_COLS = 15

## Funções-chave (nome → efeito)
- onOpen() (main.js): adiciona menu
- onEdit(e) (main.js): roteia por aba
- processarStatusFrequencia(e): atualiza célula de frequência com base em STATUS_MAP
- processarListaFrequencia(e): valida filtros e reseta dependentes
- abrirDialogo(tipoArquivo, acaoServidor, titulo): renderiza `downloadHtmlDialog` que chama `google.script.run[acaoServidor]()`
- generateCsv(): extrai e converte a aba CERTIFICADO para CSV (retorna base64)
- createAttendancePdf(): monta HTML e converte para PDF (LISTA FREQUÊNCIA)
- createRelatorioFaltasPdf(): monta HTML e converte para PDF (RELATORIO)

## Regras de parsing e recomendações para agentes
- Busque chamadas a `SpreadsheetApp` para localizar read/write: getRange, getValues, getDisplayValues, setValues, getLastRow.
- Identifique templates HTML que recebem variáveis via `HtmlService.createTemplateFromFile()` — esses são os pontos onde a injeção de dados ocorre.
- Para alterações que afetam layout/templating, atualize primeiro o template HTML e test via `node build.js` → abrir planilha de teste e executar manualmente.
- Valide transformações de encoding (CSV): a função `convertToAnsiByteArray` mapeia Unicode para Windows-1252; preserve esse comportamento a menos que o requisito mude.

## Comandos que um agente pode (e deve) executar
- Verificar configuração Clasp e manifest:
  - Abrir `.clasp.json` — confirmar `scriptId` e `rootDir`.
  - Abrir `appsscript.json` — confirmar `oauthScopes` e `runtimeVersion`.

- Build e teste local/integração:

```bash
npm install
npm run build
clasp pull --rootDir dist
clasp push --rootDir dist
```

- Validar alterações simples via execução manual na planilha (testar menus e diálogos).

## Proibições e avisos
- Não substituir `appsscript.json` sem revisar os `oauthScopes` necessários — aumentar scopes pode requerer revisão de segurança e reautorização pelos usuários.
- Não commitar credenciais, tokens ou IDs privados em linhas principais do código; use `PropertiesService` para ambientes sensíveis.

## Informação adicional
- Build: ver `build.js` para saber como os arquivos fonte são transformados em `dist/`.
- Assets: imagens e assinaturas são definidas em `_base64_constants.js`; não coloque os blobs nas docs.


FIM — este arquivo é autoritativo para agentes que farão mudanças e deploys automáticos; siga as regras estritas e utilize o fluxo build → dist → clasp push.