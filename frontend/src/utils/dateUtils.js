import { format, formatDistanceToNow } from "date-fns";

/**
 * Formats ISO date string into readable Date & Time.
 * Example output: "29 Aug 2026, 07:15 PM"
 *
 * @param {string|Date} dateValue - The date to format
 * @returns {string} - Formatted date & time
 */
export function formatDateTime(dateValue) {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return format(date, "dd MMM yyyy, hh:mm a");
  } catch (error) {
    return "";
  }
}

/**
 * Formats ISO date into relative time ago.
 * Example output: "2 hours ago", "3 days ago"
 *
 * @param {string|Date} dateValue - The date to format
 * @returns {string} - Relative time string
 */
export function getTimeAgo(dateValue) {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "";
  }
}

/**
 * Formats ISO date into Date, Time, and relative Time Ago.
 * Example output: "29 Aug 2026, 07:15 PM (2 hours ago)"
 *
 * @param {string|Date} dateValue - The date to format
 * @returns {string} - Formatted date, time and relative time
 */
export function formatDateTimeWithAgo(dateValue) {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    const dt = format(date, "dd MMM yyyy, hh:mm a");
    const ago = formatDistanceToNow(date, { addSuffix: true });
    return `${dt} (${ago})`;
  } catch (error) {
    return "";
  }
}

/**
 * Formats ISO date string into readable Date only.
 * Example output: "29 Aug 2026"
 *
 * @param {string|Date} dateValue - The date to format
 * @returns {string} - Formatted date
 */
export function formatDateOnly(dateValue) {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "";
    return format(date, "dd MMM yyyy");
  } catch (error) {
    return "";
  }
}
