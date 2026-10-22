// Currency & date formatting helpers for GO An Nahl

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}

export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", opts).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(ym: string): string {
  // ym format: 2025-10
  const [year, month] = ym.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getMonthsRange(startYM: string, endYM: string): string[] {
  const [sy, sm] = startYM.split("-").map(Number);
  const [ey, em] = endYM.split("-").map(Number);
  const out: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function getShortMonth(ym: string): string {
  const [, month] = ym.split("-");
  const d = new Date(2000, Number(month) - 1, 1);
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
}

// Generate student NIS like SN-2025-001
export function generateNIS(sequence: number, year = new Date().getFullYear()): string {
  return `SN-${year}-${String(sequence).padStart(3, "0")}`;
}

// Generate payment number like SPP-202510-001
export function generateNoPembayaran(
  sequence: number,
  date = new Date()
): string {
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `SPP-${ym}-${String(sequence).padStart(3, "0")}`;
}
