# CONTRIBUTING

Obrigado por contribuir com o projeto "Sistema EF — Casa do Educador". Este documento descreve o fluxo de trabalho recomendado para alterações, regras de build e verificações mínimas antes de enviar PRs.

## Fluxo de trabalho local
1. Faça *fork* (se necessário) e crie uma branch a partir de `main` ou da branch alvo.
2. Sempre sincronize com a versão remota antes de começar a trabalhar:

```bash
git fetch origin
git checkout -b feat/minha-melhora
clasp pull           # baixa alterações do Apps Script (se estiver vinculado ao mesmo scriptId)
```

3. Desenvolva localmente. Alterações devem ser feitas nos arquivos originais no repositório (top-level) — neste projeto o processo de build gera os artefatos em `dist/` que são efetivamente enviados para o GAS via Clasp.

4. Executar build e validar:

```bash
npm install
npm run build
# validar saída em dist/
```

5. Teste manualmente no ambiente do Sheets:
   - Abra a planilha vinculada (ou uma cópia de teste) e execute as funcionalidades.
   - Valide menus, diálogos e geração de PDF/CSV.

6. Commit e PR

```bash
git add .
git commit -m "feat: descrição curta do que foi alterado"
git push origin sua-branch
```
Crie o Pull Request apontando para `main` (ou a branch de destino) com uma descrição clara do que foi alterado e como testar.

## Regras importantes
- NUNCA edite diretamente na IDE web do Apps Script sem antes executar `clasp pull` — caso edite online, faça `clasp pull` para sincronizar e evite sobrescritas.
- O fluxo de deploy usa `npm run build` para gerar artefatos em `dist/` e depois `clasp push` a partir deste diretório; verifique `build.js` para entender transformações.
- Evite commitar blobs grandes (ex.: imagens em base64) no README ou documentação pública. Arquivos de recursos já existem no projeto em `_base64_constants.js`.

## Boas práticas de código
- Comente funções públicas e explique efeitos colaterais (ex.: write operations em planilhas externas).
- Evite usar IDs de planilhas/recursos sensíveis em commits públicos; se necessário, documente que devem ser substituídos por variáveis de ambiente/PropertiesService.
- Sempre indicar em PRs as abas/intervalos que serão impactados por mudanças (ex.: `DADOS`, `LISTA FREQUÊNCIA`, `CERTIFICADO`, `RELATORIO`).

## Testes manuais recomendados
- Gerar um PDF da Lista de Frequência com dados de amostra.
- Gerar um Relatório de Faltas com observações longas (verificar criação de anexo).
- Exportar CSV na aba `CERTIFICADO` e abrir em Excel/LibreOffice (validar encoding e separador `;`).

Obrigado — sua contribuição mantém este projeto útil para a educação local.