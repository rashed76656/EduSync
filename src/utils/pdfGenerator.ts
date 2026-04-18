import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, InstituteBranding, ResultRecord, AttendanceRecord } from '../types';

// Helper to convert image URL to Base64 (needed for jsPDF)
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

export const generateStudentTranscript = async (
  student: Student, 
  branding: InstituteBranding | null,
  results: ResultRecord[]
) => {
  const doc = new jsPDF();
  const primaryColor = '#e11d48'; // Rose-600

  // 1. Header & Branding
  if (branding?.logoUrl) {
    try {
      const imgData = await getBase64ImageFromURL(branding.logoUrl);
      doc.addImage(imgData, 'PNG', 15, 15, 25, 25);
    } catch (e) {
      console.warn('PDF Logo failed to load - Proceeding with text-only branding', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.text(branding?.name?.toUpperCase() || 'EDUSYNC INSTITUTE', 45, 25);
  
  doc.setFontSize(10);
  doc.setTextColor('#64748b');
  doc.setFont('helvetica', 'normal');
  doc.text(branding?.address || 'Campus Address Not Set', 45, 30);
  doc.text(`Email: ${branding?.email || 'N/A'} | Web: ${branding?.website || 'N/A'}`, 45, 35);

  doc.setDrawColor('#e2e8f0');
  doc.line(15, 45, 195, 45);

  // 2. Document Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1e293b');
  doc.text('OFFICIAL ACADEMIC TRANSCRIPT', 105, 55, { align: 'center' });

  // 3. Student Info Grid
  doc.setFontSize(10);
  doc.text('STUDENT INFORMATION', 15, 65);
  
  autoTable(doc, {
    startY: 68,
    theme: 'plain',
    body: [
      ['Name:', student.name, 'Roll No:', student.roll],
      ['Department:', student.department, 'Registration:', student.registration],
      ['Semester:', student.semester, 'Session:', student.session || 'N/A'],
      ['Status:', student.status.toUpperCase(), 'Date Issued:', new Date().toLocaleDateString()],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      2: { fontStyle: 'bold', cellWidth: 30 },
    }
  });

  // 4. Results Table
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIC PERFORMANCE', 15, (doc as any).lastAutoTable.finalY + 10);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 13,
    head: [['Subject Code', 'Subject Name', 'Type', 'Grade', 'Point']],
    body: results.map(r => [
      r.subjectCode,
      r.subject,
      r.examType,
      r.grade,
      r.gradePoint.toFixed(2)
    ]),
    headStyles: { fillColor: primaryColor, textColor: '#ffffff', fontStyle: 'bold' },
    alternateRowStyles: { fillColor: '#fff1f2' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // 5. Official Signature
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  doc.line(140, finalY, 190, finalY);
  doc.setFontSize(9);
  doc.text(branding?.principalName?.toUpperCase() || 'PRINCIPAL', 165, finalY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', 165, finalY + 10, { align: 'center' });

  // 6. Footer Content
  doc.setFontSize(8);
  doc.setTextColor('#94a3b8');
  doc.text('This is a computer-generated document. For verification, contact the administrative office.', 105, 285, { align: 'center' });

  doc.save(`${student.roll}_Transcript.pdf`);
};

export const generateAttendanceCertificate = async (
  student: Student,
  branding: InstituteBranding | null,
  attendance: AttendanceRecord[]
) => {
  const doc = new jsPDF();
  const primaryColor = '#e11d48';

  // [Similar Header Logic...]
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text(branding?.shortName || 'EDUSYNC', 105, 40, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor('#1e293b');
  doc.text('ATTENDANCE CERTIFICATE', 105, 55, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const details = `This is to certify that ${student.name} (Roll: ${student.roll}) of the ${student.department} department has maintained the following attendance record for the current semester.`;
  doc.text(doc.splitTextToSize(details, 170), 15, 75);

  const present = attendance.filter(a => a.status === 'present').length;
  const total = attendance.length || 1;
  const percentage = ((present / total) * 100).toFixed(1);

  autoTable(doc, {
    startY: 95,
    head: [['Category', 'Total Records', 'Presence Count', 'Percentage']],
    body: [[
      'Academic Attendance',
      total.toString(),
      present.toString(),
      `${percentage}%`
    ]],
    headStyles: { fillColor: primaryColor }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 40;
  doc.line(15, finalY, 65, finalY);
  doc.text('Academic Head', 40, finalY + 5, { align: 'center' });
  
  doc.line(140, finalY, 190, finalY);
  doc.text('Principal', 165, finalY + 5, { align: 'center' });

  doc.save(`${student.roll}_Attendance.pdf`);
};
