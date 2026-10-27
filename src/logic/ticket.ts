/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates unique complaint ticket formatted as PGD-YYYYMMDD-XXXXXX
 * (PRD FR-06 acceptance criteria)
 */
export function generateTicketNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Random 6-char alphanumeric string excluding confusing chars (0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `PGD-${year}${month}${day}-${randomPart}`;
}
