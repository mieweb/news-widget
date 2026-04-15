import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// Customize relative time thresholds for progressive disclosure
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'just now',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1mo',
    MM: '%dmo',
    y: '1y',
    yy: '%dy',
  },
});

/**
 * Format a timestamp with progressive temporal disclosure.
 * 
 * Relevance-based timestamps:
 * - < 1 minute: "just now"
 * - < 1 hour: "Xm ago" (e.g., "5m ago")
 * - < 24 hours: "Xh ago" (e.g., "3h ago")
 * - < 7 days: "Xd ago" (e.g., "2d ago")
 * - < 1 year: "Mon D" (e.g., "Dec 15")
 * - >= 1 year: "Mon D, YYYY" (e.g., "Dec 15, 2023")
 * 
 * @param date - The date to format
 * @returns A human-readable relative timestamp
 */
export function formatTimestamp(date: Date | string | number): string {
  const now = dayjs();
  const target = dayjs(date);
  
  // Handle invalid dates
  if (!target.isValid()) {
    return '';
  }
  
  const diffSeconds = now.diff(target, 'second');
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');
  
  // Progressive disclosure based on time elapsed
  if (diffSeconds < 60) {
    return 'just now';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  // For older posts, show the date
  const isThisYear = target.year() === now.year();
  
  if (isThisYear) {
    return target.format('MMM D');
  }
  
  return target.format('MMM D, YYYY');
}

/**
 * Format a timestamp in compact form (for use in tight spaces like comment lists).
 * 
 * - < 1 minute: "now"
 * - < 1 hour: "Xm"
 * - < 24 hours: "Xh"
 * - < 7 days: "Xd"
 * - >= 7 days: "Xw"
 * 
 * @param date - The date to format
 * @returns A compact relative timestamp
 */
export function formatTimestampCompact(date: Date | string | number): string {
  const now = dayjs();
  const target = dayjs(date);
  
  // Handle invalid dates
  if (!target.isValid()) {
    return '';
  }
  
  const diffSeconds = now.diff(target, 'second');
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffSeconds < 60) {
    return 'now';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }
  
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  
  return `${diffWeeks}w`;
}

/**
 * Format a full date for accessibility (aria-label).
 * Provides complete date information for screen readers.
 * 
 * @param date - The date to format
 * @returns Full date string (e.g., "December 19, 2025 at 3:45 PM")
 */
export function formatTimestampFull(date: Date | string | number): string {
  const target = dayjs(date);
  
  if (!target.isValid()) {
    return '';
  }
  
  return target.format('MMMM D, YYYY [at] h:mm A');
}
