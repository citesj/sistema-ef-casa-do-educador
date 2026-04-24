/**
 * CONFIGURAÇÕES GERAIS
 * Ajuste estas variáveis de acordo com a sua planilha.
 */
const CONFIG = {
  NOME_ABA: "CERTIFICADO",
  CELULA_MES_INICIO: "B2",
  CELULA_MES_FIM: "B3",
  LINHA_CABECALHO: 5,
  COLUNA_INTERVALO_INICIO: 6,
  COLUNA_INTERVALO_FIM: 71
};

/**
 * Função gatilho que roda automaticamente ao editar a planilha.
 */
function verificaEdicaoAbaCertificado(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  if (sheet.getName() !== CONFIG.NOME_ABA) return;
  
  const celulaEditada = range.getA1Notation();
  
  if (celulaEditada === CONFIG.CELULA_MES_INICIO || celulaEditada === CONFIG.CELULA_MES_FIM) {
    atualizarVisibilidadeColunas(sheet);
  }
}

/**
 * Função principal que orquestra a lógica.
 */
function atualizarVisibilidadeColunas(sheet) {

  const valorInicioRaw = sheet.getRange(CONFIG.CELULA_MES_INICIO).getValue();
  const valorFimRaw = sheet.getRange(CONFIG.CELULA_MES_FIM).getValue();

  if (!valorInicioRaw || !valorFimRaw) return;

  const DATA_INICIO_ABREVIADO = formatarSiglaMes(valorInicioRaw);
  const DATA_FINAL_ABREVIADO = formatarSiglaMes(valorFimRaw);

  const totalColunasParaLer = CONFIG.COLUNA_INTERVALO_FIM - CONFIG.COLUNA_INTERVALO_INICIO + 1;
  const valoresCabecalho = sheet.getRange(
    CONFIG.LINHA_CABECALHO, 
    CONFIG.COLUNA_INTERVALO_INICIO, 
    1, 
    totalColunasParaLer
  ).getValues()[0];

  const indexRelativoInicio = valoresCabecalho.indexOf(DATA_INICIO_ABREVIADO);
  const indexRelativoFim = valoresCabecalho.lastIndexOf(DATA_FINAL_ABREVIADO) + 1;

  if (indexRelativoInicio === -1 || indexRelativoFim === -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Mês não encontrado no cabeçalho.", "Erro");
    return;
  }

  const colunaInicialAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexRelativoInicio;
  const colunaFinalAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexRelativoFim;

  if (colunaFinalAlvo < colunaInicialAlvo) {
    SpreadsheetApp.getActiveSpreadsheet().toast("O mês final não pode ser anterior ao inicial.", "Aviso");
    return;
  }

  gerenciarVisibilidadeColunas(sheet, colunaInicialAlvo, colunaFinalAlvo);
}

/**
 * Normaliza e formata a representação de um mês para uma sigla de 3 letras em maiúsculas.
 * * @param {string|Date|number} valor - O valor a ser formatado. Aceita strings, objetos Date ou números.
 * @returns {string} Sigla do mês com 3 caracteres em caixa alta (ex: "JAN", "MAI").
 */
const formatarSiglaMes = (valor) => {
  if (valor instanceof Date) {
    return valor.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().substring(0, 3);
  }

  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 3)
    .toUpperCase();
};

/**
 * Gerencia a visibilidade das colunas de forma otimizada, exibindo um intervalo específico
 * e ocultando as colunas adjacentes (esquerda e direita) dentro do limite configurado.
 * * Esta estratégia é mais eficiente que resetar a visibilidade coluna por coluna,
 * pois utiliza operações de intervalo para minimizar o número de chamadas à API da planilha.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A aba da planilha onde a visibilidade será aplicada.
 * @param {number} colInicioVisivel - O índice da primeira coluna que deve permanecer visível.
 * @param {number} colFimVisivel - O índice da última coluna que deve permanecer visível.
 * @returns {void}
 */
function gerenciarVisibilidadeColunas(sheet, colInicioVisivel, colFimVisivel) {
  const numColunasVisiveis = colFimVisivel - colInicioVisivel + 1;
  
  // Primeiro, garante que o intervalo central esteja visível
  sheet.showColumns(colInicioVisivel, numColunasVisiveis);

  // Oculta a "asa" esquerda (entre o início configurado e o início do intervalo visível)
  if (colInicioVisivel > CONFIG.COLUNA_INTERVALO_INICIO) {
    const numColunasOcultarEsq = colInicioVisivel - CONFIG.COLUNA_INTERVALO_INICIO;
    sheet.hideColumns(CONFIG.COLUNA_INTERVALO_INICIO, numColunasOcultarEsq);
  }

  // Oculta a "asa" direita (entre o fim do intervalo visível e o fim configurado)
  if (colFimVisivel < CONFIG.COLUNA_INTERVALO_FIM) {
    const inicioOcultarDir = colFimVisivel + 1;
    const numColunasOcultarDir = CONFIG.COLUNA_INTERVALO_FIM - colFimVisivel;
    sheet.hideColumns(inicioOcultarDir, numColunasOcultarDir);
  }
}