/**
 * CONFIGURAÇÕES GERAIS
 * Ajuste estas variáveis de acordo com a sua planilha.
 */
const CONFIG = {
  NOME_ABA: "CERTIFICADO",               // Nome da aba onde o script vai rodar
  CELULA_MES_INICIO: "B2",          // Célula do menu suspenso (Mês Inicial)
  CELULA_MES_FIM: "B3",             // Célula do menu suspenso (Mês Final)
  LINHA_CABECALHO: 5,               // Linha onde estão os nomes dos meses (JAN, FEV...)
  COLUNA_INTERVALO_INICIO: 6,       // Número da coluna onde começa o calendário (Ex: D = 4)
  COLUNA_INTERVALO_FIM: 71          // Número da coluna onde termina o calendário (Ex: 12 meses * 4 colunas = 48 + offset)
};

/**
 * Função gatilho que roda automaticamente ao editar a planilha.
 */
function verificaEdicaoAbaCertificado(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  // Verificações de segurança para garantir performance (fail-fast)
  if (sheet.getName() !== CONFIG.NOME_ABA) return;
  
  const celulaEditada = range.getA1Notation();
  
  // Só roda se a edição for em um dos campos de data
  if (celulaEditada === CONFIG.CELULA_MES_INICIO || celulaEditada === CONFIG.CELULA_MES_FIM) {
    atualizarVisibilidadeColunas(sheet);
  }
}

/**
 * Função principal que orquestra a lógica.
 */
function atualizarVisibilidadeColunas(sheet) {

  // 1. Leitura dos valores de entrada
  const valorInicioRaw = sheet.getRange(CONFIG.CELULA_MES_INICIO).getValue();
  const valorFimRaw = sheet.getRange(CONFIG.CELULA_MES_FIM).getValue();

  // Validação simples
  if (!valorInicioRaw || !valorFimRaw) return;

  // 2. Tratamento dos dados (Uppercase + 3 letras)
  const DATA_INICIO_ABREVIADO = formatarMes(valorInicioRaw);
  const DATA_FINAL_ABREVIADO = formatarMes(valorFimRaw);

  // 3. Obter os dados da linha de cabeçalho para busca
  // Pegamos apenas o intervalo que contém os meses para ser mais performático
  const totalColunasParaLer = CONFIG.COLUNA_INTERVALO_FIM - CONFIG.COLUNA_INTERVALO_INICIO + 1;
  const valoresCabecalho = sheet.getRange(
    CONFIG.LINHA_CABECALHO, 
    CONFIG.COLUNA_INTERVALO_INICIO, 
    1, 
    totalColunasParaLer
  ).getValues()[0];

  // 4. Identificar índices
  // Nota: indexOf retorna índice base-0 do array, precisamos converter para índice da planilha
  const indexRelativoInicio = valoresCabecalho.indexOf(DATA_INICIO_ABREVIADO);
  const indexRelativoFim = valoresCabecalho.lastIndexOf(DATA_FINAL_ABREVIADO) + 1;

  if (indexRelativoInicio === -1 || indexRelativoFim === -1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Mês não encontrado no cabeçalho.", "Erro");
    return;
  }

  // Cálculos de colunas reais na planilha
  // Coluna Alvo Inicial = Coluna de Início do Intervalo + Índice encontrado
  const colunaInicialAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexRelativoInicio;
  
  // Coluna Alvo Final = Coluna de Início + Índice encontrado
  const colunaFinalAlvo = CONFIG.COLUNA_INTERVALO_INICIO + indexRelativoFim;

  // Verificação lógica (se o usuário colocar Fim antes do Início)
  if (colunaFinalAlvo < colunaInicialAlvo) {
    SpreadsheetApp.getActiveSpreadsheet().toast("O mês final não pode ser anterior ao inicial.", "Aviso");
    return;
  }

  // 5. Aplicação da Visibilidade (Performance Otimizada)
  aplicarOcultamentoInteligente(sheet, colunaInicialAlvo, colunaFinalAlvo);
}

/**
 * Função utilitária para formatar a string do mês.
 */
function formatarMes(valor) {
  if (typeof valor !== 'string') return String(valor).substring(0, 3).toUpperCase();
  return valor.trim().substring(0, 3).toUpperCase();
}

/**
 * Lógica para ocultar/mostrar colunas.
 * Estratégia: Resetar (mostrar tudo) é lento se feito coluna por coluna.
 * Melhor estratégia: Mostrar o intervalo desejado e ocultar as "asas" (esquerda e direita).
 */
function aplicarOcultamentoInteligente(sheet, colInicioVisivel, colFimVisivel) {
  // Primeiro, garante que o intervalo desejado está visível
  const numColunasVisiveis = colFimVisivel - colInicioVisivel + 1;
  sheet.showColumns(colInicioVisivel, numColunasVisiveis);

  // Lógica da Esquerda: Ocultar do início do calendário até antes do início visível
  if (colInicioVisivel > CONFIG.COLUNA_INTERVALO_INICIO) {
    const numColunasOcultarEsq = colInicioVisivel - CONFIG.COLUNA_INTERVALO_INICIO;
    sheet.hideColumns(CONFIG.COLUNA_INTERVALO_INICIO, numColunasOcultarEsq);
  }

  // Lógica da Direita: Ocultar de depois do fim visível até o final do calendário
  if (colFimVisivel < CONFIG.COLUNA_INTERVALO_FIM) {
    const inicioOcultarDir = colFimVisivel + 1;
    const numColunasOcultarDir = CONFIG.COLUNA_INTERVALO_FIM - colFimVisivel;
    sheet.hideColumns(inicioOcultarDir, numColunasOcultarDir);
  }
}