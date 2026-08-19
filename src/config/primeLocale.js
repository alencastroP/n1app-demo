// src/config/primeLocale.js
// Registra o locale 'pt-BR' do PrimeReact (usado por <Calendar locale="pt-BR">).
// Importado como efeito colateral no main.jsx para estar sempre registrado antes
// de qualquer componente montar — senão o Calendar lança
// "The chooseDate option is not found in the current locale('pt-BR')".
//
// Herdamos TODAS as chaves do locale padrão 'en' (inclui as aria como chooseDate,
// chooseMonth, chooseYear, prevDecade, etc.) e sobrescrevemos só os rótulos em
// português — assim nenhuma chave fica faltando, independente da versão do PrimeReact.
import { addLocale, localeOptions } from 'primereact/api';

// localeOptions() sem argumento devolve o locale atual (en no boot).
const base = (() => {
  try {
    return localeOptions('en') || localeOptions() || {};
  } catch {
    return {};
  }
})();

addLocale('pt-BR', {
  ...base,
  firstDayOfWeek: 0,
  dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
  dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  today: 'Hoje',
  clear: 'Limpar',
  weekHeader: 'Sem',
  dateFormat: 'dd/mm/yy',
  // aria (sobrescreve os herdados do 'en' com PT-BR)
  chooseDate: 'Escolher data',
  chooseMonth: 'Escolher mês',
  chooseYear: 'Escolher ano',
  prevDecade: 'Década anterior',
  nextDecade: 'Próxima década',
  prevYear: 'Ano anterior',
  nextYear: 'Próximo ano',
  prevMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
});
