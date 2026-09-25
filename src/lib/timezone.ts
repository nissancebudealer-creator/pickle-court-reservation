import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';

export const MANILA_TIMEZONE = 'Asia/Manila';

/**
 * Returns current Date in Asia/Manila timezone
 */
export function getManilaNow(): Date {
  return toZonedTime(new Date(), MANILA_TIMEZONE);
}

/**
 * Returns today's date string in Asia/Manila (YYYY-MM-DD)
 */
export function getManilaTodayString(): string {
  return formatInTimeZone(new Date(), MANILA_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Formats a Date or ISO string into a specified format in Asia/Manila timezone
 */
export function formatManila(date: Date | string | number, formatStr: string): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return formatInTimeZone(d, MANILA_TIMEZONE, formatStr);
}

/**
 * Formats a YYYY-MM-DD string into a friendly label (e.g., "Today", "Tomorrow", or "Friday, Sep 25")
 */
export function formatFriendlyDate(dateStr: string): string {
  const todayStr = getManilaTodayString();
  const todayDate = parseISO(todayStr);
  const targetDate = parseISO(dateStr);

  const tomorrowStr = formatInTimeZone(addDays(todayDate, 1), MANILA_TIMEZONE, 'yyyy-MM-dd');

  if (dateStr === todayStr) {
    return `Today (${formatInTimeZone(targetDate, MANILA_TIMEZONE, 'MMM d')})`;
  }
  if (dateStr === tomorrowStr) {
    return `Tomorrow (${formatInTimeZone(targetDate, MANILA_TIMEZONE, 'MMM d')})`;
  }
  return formatInTimeZone(targetDate, MANILA_TIMEZONE, 'EEE, MMM d');
}

/**
 * Generates an array of date strings (YYYY-MM-DD) starting from today up to maxDays ahead
 */
export function getAvailableBookingDates(maxDays: number = 7): string[] {
  const dates: string[] = [];
  const todayStr = getManilaTodayString();
  const baseDate = parseISO(todayStr);

  for (let i = 0; i <= maxDays; i++) {
    const nextDate = addDays(baseDate, i);
    dates.push(formatInTimeZone(nextDate, MANILA_TIMEZONE, 'yyyy-MM-dd'));
  }
  return dates;
}

/**
 * Checks if a slot has already expired based on current Manila time.
 * @param dateStr "YYYY-MM-DD"
 * @param endTimeStr "18:30:00" or "18:30"
 */
export function isSlotPast(dateStr: string, endTimeStr: string): boolean {
  const now = getManilaNow();
  const todayStr = getManilaTodayString();

  if (dateStr < todayStr) {
    return true;
  }
  if (dateStr > todayStr) {
    return false;
  }

  // Same day: compare time
  const [hours, minutes] = endTimeStr.split(':').map(Number);
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  if (currentHours > hours) return true;
  if (currentHours === hours && currentMinutes >= minutes) return true;
  return false;
}

/**
 * Generate unique ticket ID: PB-YYMMDD-XXX
 */
export function generateReservationId(dateStr: string): string {
  // dateStr is '2026-09-25' -> '260925'
  const compactDate = dateStr.replace(/-/g, '').slice(2);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `PB-${compactDate}-${randomSuffix}`;
}
