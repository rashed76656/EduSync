import type { FeeRecord } from '../types';

export interface LateFineResult {
  isOverdue: boolean;
  daysOverdue: number;
  lateFineAmount: number;
  totalAmount: number;
}

/**
 * Calculates late fine based on due date.
 * Business Logic: 2% per week of the original amount, max 20%.
 */
export function calculateLateFine(amount: number, dueDate: Date): LateFineResult {
  const now = new Date();
  const due = new Date(dueDate);
  
  if (now <= due) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      lateFineAmount: 0,
      totalAmount: amount
    };
  }

  const diffTime = Math.abs(now.getTime() - due.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 2% per 7 days
  const weeksOverdue = Math.ceil(diffDays / 7);
  let finePercent = weeksOverdue * 2;
  
  // Cap at 20%
  if (finePercent > 20) finePercent = 20;
  
  const lateFineAmount = Math.round((amount * finePercent) / 100);
  
  return {
    isOverdue: true,
    daysOverdue: diffDays,
    lateFineAmount,
    totalAmount: amount + lateFineAmount
  };
}

/**
 * Helper to check and apply fine logic to a fee record
 */
export function checkFeeLateFine(fee: FeeRecord): LateFineResult {
  const dueDate = fee.dueDate && (fee.dueDate as any).toDate 
    ? (fee.dueDate as any).toDate() 
    : new Date(fee.dueDate as any);
  return calculateLateFine(fee.amount, dueDate);
}
