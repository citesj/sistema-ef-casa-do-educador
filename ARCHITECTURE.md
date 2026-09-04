# ARCHITECTURE

Este documento descreve a arquitetura do sistema, estrutura de diretórios relevante ao desenvolvimento local com Clasp e como os componentes se comunicam.

## Resumo arquitetural
- Tipo: Google Sheets Bound Script (GAS) gerenciado localmente com `@google/clasp`.
- Runtime: V8 (JavaScript moderno suportado).
- Build: `node build.js` produz artefatos em `dist/` que são enviados via `clasp push`.

## Estrutura de diretórios e arquivos relevantes
```text
root/
  .clasp.json            # scriptId e rootDir (dist)
  appsscript.json        # manifest do GAS (scopes, runtimeVersion)
  build.js               # script de build
  package.json           # scripts npm: build, clasp:upload
  _constants.js          # tema PDF (PDF_THEME)
  _utils.js              # utilitários (data, preenchimento, sincronização)
  _base64_constants.js   # logos e assinaturas em base64 (não expor no docs)
  main.js                # onOpen, onEdit, roteador de abas
  processarStatusFrequencia.js
  processarListaFrequencia.js
  iniciarDownload.js
  generateCsv.js
  createAttendanceListPdf.js
  createAbsenceReportPdf.js
  TemplateRelatorio*.html
  downloadHtmlDialog.html
  dist/                  # rootDir do Clasp; contém artifacts pronta para push
```

### Observação sobre `rootDir`
`.clasp.json` aponta `rootDir: "dist"`. O fluxo recomendado:
- Desenvolver/editar arquivos fonte no repositório top-level
- Executar `npm run build` → gera/compila no `dist/`
- Executar `clasp push` (ou `npm run clasp:upload`) para enviar os arquivos do `dist/` ao GAS

## Mapeamento de responsabilidades (arquivo → função)
- main.js
  - onOpen: cria menu 'Relatórios'
  - onEdit: roteia eventos por aba (invoca processarStatusFrequencia, processarListaFrequencia)

- processarStatusFrequencia.js
  - Atualiza a célula de frequência (coluna à direita) quando uma célula de status é alterada.
  - Regras: COLUNAS_STATUS (Set de índices), STATUS_MAP (P → 4.0, X/F/E → 0), MANUAL_STATUSES (SA, CT) que limpam a célula de frequência.

- processarListaFrequencia.js
  - Valida células de filtro nas linhas superiores (1..3); reseta filtros dependentes e aplica exclusividade de seleção.

- iniciarDownload.js
  - Abrir modal HTML (downloadHtmlDialog) que chama `google.script.run[acaoServidor]()`

- generateCsv.js
  - Extrai intervalo da aba `CERTIFICADO`, converte para CSV (separador `;`), executa conversão para ANSI/Windows-1252 e retorna base64.

- createAttendanceListPdf.js / createAbsenceReportPdf.js
  - Extrai dados das abas `LISTA FREQUÊNCIA` e `RELATORIO` respectivamente, injeta em templates HTML e converte para PDF.

- Templates HTML
  - TemplateRelatorioListaFrequencia.html: layout A4 landscape para lista de presença.
  - TemplateRelatorioFaltas.html: layout A4 landscape com anexo de observações quando necessário.

## Dependências e escopos
- appsscript.json define os scopes mínimos necessários:
  - spreadsheets (ler/escrever)
  - script.external_request (para requests externos, se houver)
  - script.container.ui (para modais/dialogs)

## Boas práticas e limitações do GAS
- GAS não suporta nativamente `import`/`require` do Node.js no runtime; para usar módulos é necessário um bundler que gere arquivos concatenados compatíveis com o ambiente do GAS.
- Evite operações muito pesadas dentro de loops síncronos em planilha (getValues / setValues em blocos são preferíveis).
- Prefira `getDisplayValues()` quando for importante apresentar valores formatados no PDF/HTML.

## Observações de segurança
- IDs de planilhas (ex.: em _utils.js `ID_ARQUIVO_ORIGEM`) são sensíveis; para ambientes diferentes use `PropertiesService` ou variáveis de ambiente no processo de build.
- Não comite credenciais ou tokens no repositório.

