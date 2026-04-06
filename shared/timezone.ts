/**
 * Utilitário de timezone para garantir que todas as datas usem o fuso horário de São Paulo
 */

export const TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date no horário de São Paulo
 * @param dateStr String no formato YYYY-MM-DD
 * @returns Date object no horário de São Paulo
 */
export function parseLocalDate(dateStr: string): Date {
  // Adiciona horário meio-dia para evitar problemas de timezone
  return new Date(dateStr + 'T12:00:00');
}

/**
 * Retorna a data atual no horário de São Paulo
 * @returns Date object com a data/hora atual de São Paulo
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Retorna a data atual no formato YYYY-MM-DD no horário de São Paulo
 * @returns String no formato YYYY-MM-DD
 */
export function getCurrentDateString(): string {
  const now = new Date();
  // Ajusta para o timezone de São Paulo (GMT-3)
  const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const year = saoPauloTime.getFullYear();
  const month = String(saoPauloTime.getMonth() + 1).padStart(2, '0');
  const day = String(saoPauloTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 * @param date Date object ou string
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converte Date para string no formato YYYY-MM-DD
 * @param date Date object
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
