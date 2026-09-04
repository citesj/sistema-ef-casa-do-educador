# Sistema EF — Casa do Educador

## Visão geral

Planilha e scripts para apoiar o fluxo de geração de relatórios de frequência e relatórios de faltas da "Casa do Educador" (Secretaria Municipal de Educação — Prefeitura de São José). É um Google Sheets *bound script* implementado em Google Apps Script (V8) e gerenciado localmente via `@google/clasp` para desenvolvimento, build e deploy.

O sistema provê:
- Menus customizados no Google Sheets para geração de PDFs e CSVs.
- Processamento automático de status/frequência via gatilho `onEdit`.
- Templates HTML para renderização de PDFs (listas de frequência e relatórios de faltas).
- Utilitários para preenchimento em lote, sincronização entre planilhas e conversões de encoding para CSV.

## Stack
- Language(s): JavaScript (Apps Script, V8) + HTML templates
- Runtime: Google Apps Script (V8)
- Tooling: Node.js (LTS), npm, @google/clasp

## Como o projeto está organizado (top-level)

```text
.clasp.json                # Configuração do clasp (scriptId, rootDir)
appsscript.json            # Manifest do Apps Script (scopes, runtime)
package.json               # scripts (build, clasp:upload)
build.js                   # script de build
dist/                      # diretório apontado por rootDir (artefatos para push)
*.js                       # arquivos .js usados pelo GAS (handlers, geradores)
*.html                     # templates HTML usados com HtmlService
_constants.js              # configurações visuais (PDF_THEME)
_utils.js                  # utilitários (getCurrentDate, etc.)
_base64_constants.js       # constantes de imagens (LOGO_BRASAO, ASSINATURA...) — não incluir blobs nos docs
TemplateRelatorioFaltas.html
TemplateRelatorioListaFrequencia.html
downloadHtmlDialog.html
```

### Como tudo se encaixa
- `onOpen()` (main.js) adiciona menu customizado que chama funções que abrem `downloadHtmlDialog.html`.
- O diálogo HTML usa `google.script.run` para chamar funções servidoras que retornam objetos com `{ fileData, fileName, fileExtension }` codificados em base64.
- Geração de PDF: Templates HTML (TemplateRelatorioFaltas, TemplateRelatorioListaFrequencia) são preenchidos com dados extraídos via `getRange().getDisplayValues()` e convertidos para PDF com `Utilities.newBlob(...).getAs(MimeType.PDF)`.
- `onEdit(e)` roteia alterações por aba (DADOS, LISTA FREQUÊNCIA) e chama `processarStatusFrequencia` e `processarListaFrequencia`.

## Pré-requisitos
- Node.js (versão LTS recomendada)
- npm
- Conta Google com acesso à planilha e permissões para usar Apps Script
- `@google/clasp` instalado (globalmente recomendado)

## Setup do ambiente local (passo a passo)

1. Instale o Clasp (global):

```bash
npm i -g @google/clasp
```

2. Faça login no Clasp com a conta Google usada no projeto:

```bash
clasp login
```

3. Clone ou vincule o projeto localmente usando o `scriptId` (se quiser trabalhar já ligado ao projeto existente):

```bash
clasp clone 13Ry7UNhKmaTpEAqD1p79AveDBe-HhIX75hTCT9AOieFDGT6ShM8o3QBm --rootDir dist
```

Observação: este repositório tem `.clasp.json` com `rootDir: "dist"` — o fluxo esperado é compilar/gerar os arquivos em `dist/` e então executar `clasp push` a partir desse diretório.

4. Instale dependências locais e construa antes do deploy:

```bash
npm install
npm run build         # executa node build.js — gera artifacts em dist/
npm run clasp:upload  # executa build + clasp push --force
```

## Comandos úteis do Clasp
- clasp pull           # baixa alterações da nuvem
- clasp push           # envia alterações locais (respeitar rootDir)
- clasp push --watch   # (quando disponível) observa e envia alterações
- clasp open           # abre o editor web do Apps Script
- clasp version        # cria uma versão (equivalente ao versionamento no GAS)
- clasp deploy         # cria/atualiza deploys (se aplicável)

> Regra importante: sempre executar `clasp pull` antes de editar online (IDE) e antes de `clasp push` para evitar sobrescritas.

## Mapeamento de arquivos importantes
- main.js
  - onOpen() — cria menu '🖨️ Relatórios' que chama: iniciarDownloadFrequencia, iniciarDownloadRelatorio, iniciarDownloadCertificados
  - onEdit(e) — roteador por abas (DADOS → processarStatusFrequencia, LISTA FREQUÊNCIA → processarListaFrequencia)

- processarStatusFrequencia.js
  - CONFIG_CACHE.DADOS (COLUNAS_STATUS, PRIMEIRA_LINHA_DADOS, STATUS_MAP, MANUAL_STATUSES)
  - processarStatusFrequencia(e) — atualiza célula de frequência (coluna à direita) com base no status selecionado

- processarListaFrequencia.js
  - CONFIG_FILTROS — regras para filtros nas linhas 1..3 (reset/validação)
  - processarListaFrequencia(e) — aplica filtros e reseta dependentes

- iniciarDownload.js
  - abrirDialogo(tipoArquivo, acaoServidor, tituloDialogo) — abre `downloadHtmlDialog.html` preenchido com `tipoArquivo` e `acaoServidor`

- generateCsv.js
  - generateCsv() — valida aba CERTIFICADO, extrai intervalo, converte para CSV (conversão ANSI/Windows-1252) e retorna base64

- createAttendanceListPdf.js
  - createAttendancePdf() — extrai metadados e registros da aba LISTA FREQUÊNCIA, monta HTML com TemplateRelatorioListaFrequencia e converte para PDF

- createAbsenceReportPdf.js
  - createRelatorioFaltasPdf() — extrai dados da aba RELATORIO, trata observações longas (anexos), monta TemplateRelatorioFaltas e converte para PDF

- _constants.js
  - PDF_THEME (tema visual usado nos templates)

- _utils.js
  - getCurrentDate(format)
  - preencherIntercaladoLote()
  - sincronizarArquivosDistintos() — OBS: abre outra planilha por ID (openById)

- _base64_constants.js
  - LOGO_BRASAO, ASSINATURA_CASA_EDUCADOR (imagens em base64; não as inclua na documentação)

## Escopos OAuth (appsscript.json)
- https://www.googleapis.com/auth/spreadsheets
- https://www.googleapis.com/auth/script.external_request
- https://www.googleapis.com/auth/script.container.ui

## Guia rápido de uso (usuário da planilha)
1. Abra a planilha vinculada.
2. Use o menu “🖨️ Relatórios” para gerar PDF/CSV.
3. Ao clicar em um item do menu, um modal irá aparecer e, em seguida, o download será iniciado automaticamente.
4. Edições nas abas DADOS e LISTA FREQUÊNCIA disparam validações/atualizações automáticas.

---

Se quiser, crio agora o PR da branch `docs/add-documentation` para revisão final.
