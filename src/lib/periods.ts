// Reward periods (Lomé = UTC), shared by the rewards admin screens.

/** ISO week key (`2026-W38`) of the week before `date`. */
export function previousWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 7));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** `datetime-local` input value (UTC) of an ISO date, empty when invalid. */
export function toUtcInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
}

/** ISO string of a `datetime-local` value read as UTC (Lomé time), null when invalid. */
export function fromUtcInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
