/**
 * Standard Bangladeshi Polytechnic Institute Grading Logic
 */

export function calculateGrade(marks: number): { grade: string; gradePoint: number } {
  if (marks >= 80) return { grade: 'A+', gradePoint: 4.00 };
  if (marks >= 75) return { grade: 'A', gradePoint: 3.75 };
  if (marks >= 70) return { grade: 'A-', gradePoint: 3.50 };
  if (marks >= 65) return { grade: 'B+', gradePoint: 3.25 };
  if (marks >= 60) return { grade: 'B', gradePoint: 3.00 };
  if (marks >= 55) return { grade: 'B-', gradePoint: 2.75 };
  if (marks >= 50) return { grade: 'C+', gradePoint: 2.50 };
  if (marks >= 45) return { grade: 'C', gradePoint: 2.25 };
  if (marks >= 40) return { grade: 'D', gradePoint: 2.00 };
  return { grade: 'F', gradePoint: 0.00 };
}
