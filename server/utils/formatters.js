import crypto from 'node:crypto';

const CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const GROUP_TITLE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const STATUS_LABELS = {
  completed: 'Berhasil',
  pending: 'Menunggu',
  cancelled: 'Dibatalkan',
};

export function formatIdr(amount, type = null) {
  const formatted = CURRENCY_FORMATTER.format(Number(amount) || 0);
  if (type === 'income') return `+${formatted}`;
  if (type === 'expense') return `-${formatted}`;
  return formatted;
}

export function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

export function parseNonNegativeInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) return null;
  return num;
}

export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function generateTxCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TRX-${datePart}-${randomPart}`;
}

export function toMysqlDatetime(input) {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toDateKey(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getRelativeDayLabel(date) {
  const today = new Date();
  const targetKey = toDateKey(date);
  if (targetKey === toDateKey(today)) return 'Hari Ini';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (targetKey === toDateKey(yesterday)) return 'Kemarin';

  return GROUP_TITLE_FORMATTER.format(date);
}

/**
 * Formats a joined transaction SQL row into the structure expected by the frontend.
 */
export function formatTransactionRow(row) {
  const occurredDate = new Date(row.occurred_at);
  const amount = Number(row.amount);

  return {
    id: String(row.id),
    title: row.title,
    category: row.category_name,
    categoryId: Number(row.category_id),
    categorySlug: row.category_slug,
    paymentMethod: row.payment_method_name,
    paymentMethodId: Number(row.payment_method_id),
    time: TIME_FORMATTER.format(occurredDate).replace('.', ':'),
    dateLabel: DATE_LABEL_FORMATTER.format(occurredDate),
    occurredAt: occurredDate.toISOString(),
    amount,
    formattedAmount: formatIdr(amount, row.type),
    type: row.type,
    icon: row.category_icon || 'receipt_long',
    iconBgClass: row.category_bg_class || 'bg-primary-fixed',
    iconTextClass: row.category_color_class || 'text-primary',
    txCode: row.tx_code,
    status: STATUS_LABELS[row.status] || row.status,
    rawStatus: row.status,
    notes: row.notes ?? null,
  };
}

/** Groups formatted transaction items by local calendar day. */
export function groupTransactionsByDate(items) {
  const groupsMap = new Map();

  for (const item of items) {
    const date = new Date(item.occurredAt);
    const key = toDateKey(date);
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        id: key,
        label: getRelativeDayLabel(date),
        subLabel: DATE_LABEL_FORMATTER.format(date),
        items: [],
      });
    }
    groupsMap.get(key).items.push(item);
  }

  return Array.from(groupsMap.values());
}

/** Computes SQL DATETIME start/end bounds for frontend period filters. */
export function getPeriodBounds(period, startDate, endDate) {
  const now = new Date();

  if (period === 'Bulan Ini') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: toMysqlDatetime(start), end: toMysqlDatetime(end) };
  }

  if (period === 'Minggu Ini') {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: toMysqlDatetime(start), end: toMysqlDatetime(end) };
  }

  if (period === 'Kustom') {
    const start = startDate ? toMysqlDatetime(`${startDate}T00:00:00`) : null;
    const end = endDate ? toMysqlDatetime(`${endDate}T23:59:59`) : null;
    return { start, end };
  }

  return { start: null, end: null };
}
