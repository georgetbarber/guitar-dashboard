/** Calendar date experienced by the learner when an observation is made. */
export function localDateAt(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Difference between calendar dates, independent of 23/25-hour DST days. */
export function calendarDaysBetween(earlier: string, later: string): number {
  const utcDay = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / 86_400_000;
  };
  return Math.max(0, utcDay(later) - utcDay(earlier));
}
