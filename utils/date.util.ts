/**
 * Efficiently computes next occurrence date based on recurrence pattern.
 * Uses integer arithmetic, no heavy loops.
 */
export class RecurrenceCalculator {
  static getNextDueDate(
    fromDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    billingDay: number
  ): Date {
    const next = new Date(fromDate);
    next.setHours(0, 0, 0, 0);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly': {
        // Move to next month, then adjust to billing day
        next.setMonth(next.getMonth() + 1);
        const targetDay = Math.min(billingDay, this.getDaysInMonth(next.getFullYear(), next.getMonth()));
        next.setDate(targetDay);
        break;
      }
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default: // custom – fallback to monthly
        next.setMonth(next.getMonth() + 1);
        const targetDay = Math.min(billingDay, this.getDaysInMonth(next.getFullYear(), next.getMonth()));
        next.setDate(targetDay);
    }
    return next;
  }

  private static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Generate all due dates between start and end dates (for preview).
   * Uses iterative calculation, O(n) where n = number of occurrences.
   */
  static generateOccurrences(
    startDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    billingDay: number,
    endDate: Date
  ): Date[] {
    const results: Date[] = [];
    let current = new Date(startDate);
    // Normalize to billing day if monthly
    if (frequency === 'monthly') {
      const daysInMonth = this.getDaysInMonth(current.getFullYear(), current.getMonth());
      current.setDate(Math.min(billingDay, daysInMonth));
    }
    while (current <= endDate) {
      results.push(new Date(current));
      current = this.getNextDueDate(current, frequency, billingDay);
      if (results.length > 1000) break; // safety limit
    }
    return results;
  }
}