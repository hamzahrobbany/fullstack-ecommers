import dayjs from 'dayjs';

export const isBrowser = typeof window !== 'undefined';

export const formatCurrency = (value: number, currency = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDateTime = (value: string | Date) => {
  return dayjs(value).format('DD MMM YYYY HH:mm');
};

export const safeJsonParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('[helpers] gagal parse JSON:', error);
    return fallback;
  }
};
