import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  CheckCircle2, 
  Printer, 
  Layout,
  User,
  History,
  ShieldCheck
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { useGlobalStudents } from '../../hooks/useGlobalStudents';
import { useAuthStore } from '../../store/authStore';
import { generateStudentTranscript, generateAttendanceCertificate } from '../../utils/pdfGenerator';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const { branding } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { students } = useGlobalStudents({ searchQuery });
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchStudentData = async (studentId: string, collName: 'results' | 'attendance') => {
    const q = query(
      collection(db, collName), 
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Client-side sort to avoid Missing Index error
    return data.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const handleGenerateTranscript = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const results = await fetchStudentData(selectedStudent.id, 'results');
      await generateStudentTranscript(selectedStudent, branding, results as any);
      toast.success('Official Transcript Generated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile transcript data.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAttendance = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const attendance = await fetchStudentData(selectedStudent.id, 'attendance');
      await generateAttendanceCertificate(selectedStudent, branding, attendance as any);
      toast.success('Attendance Certificate Ready');
    } catch (err) {
      toast.error('Failed to generate attendance data.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display tracking-tight uppercase italic">
            Document <span className="text-primary">Factory</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">
            Generate branded certificates & official academic transcripts.
          </p>
        </div>
        
        <GlassCard className="p-3 bg-white/50 border-gray-100 flex items-center gap-3">
           <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Printer className="w-5 h-5 text-white" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-gray-400">PDF Engine</p>
              <p className="text-xs font-black text-gray-900 uppercase">jsPDF V2.5.1</p>
           </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Student Selector */}
         <GlassCard className="p-8 border-white/50 bg-white/40 shadow-2xl space-y-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
               <User className="w-4 h-4 text-primary" />
               Select Target Student
            </h3>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by Name or Roll..."
                className="w-full h-14 bg-white/60 border-0 rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {students.length === 0 ? (
                 <div className="text-center py-20 opacity-30">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Identity Signal...</p>
                 </div>
               ) : (
                 students.map(s => (
                   <button
                     key={s.id}
                     onClick={() => setSelectedStudent(s)}
                     className={`w-full flex items-center gap-4 p-4 rounded-3xl border transition-all ${
                       selectedStudent?.id === s.id 
                         ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-102' 
                         : 'bg-white/60 text-gray-900 border-gray-100 hover:border-primary/30'
                     }`}
                   >
                     <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 p-0.5 overflow-hidden shadow-sm shrink-0">
                        <img src="/src/assets/profile.png" className="w-full h-full object-cover" />
                     </div>
                     <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-black truncate uppercase tracking-tight">{s.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedStudent?.id === s.id ? 'text-white/80' : 'text-gray-400'}`}>
                           Roll: {s.roll} • {s.department}
                        </p>
                     </div>
                     {selectedStudent?.id === s.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                   </button>
                 ))
               )}
            </div>
         </GlassCard>

         {/* Document Options */}
         <div className="space-y-8">
            <GlassCard className="p-8 border-white/50 bg-white/40 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-8">
                     <Layout className="w-4 h-4 text-primary" />
                     Production Options
                  </h3>

                  <div className="space-y-4">
                     {/* Transcript Card */}
                     <div className={`p-6 rounded-3xl border-2 transition-all ${selectedStudent ? 'bg-white border-primary/10 hover:border-primary cursor-pointer' : 'bg-gray-50/50 border-gray-100 opacity-50 grayscale'}`}>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                                 <FileText className="w-5 h-5 text-rose-600" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Academic Transcript</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase">Official Signature Ready</p>
                              </div>
                           </div>
                           <Button 
                              onClick={handleGenerateTranscript} 
                              disabled={!selectedStudent || isGenerating}
                              className="h-10 px-6 gap-2 bg-primary rounded-xl text-[9px] font-black uppercase tracking-widest"
                              isLoading={isGenerating}
                           >
                              <Download className="w-4 h-4" /> Export PDF
                           </Button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                           Detailed marksheet including subject codes, grades, and cumulative grade points branded with institute identity.
                        </p>
                     </div>

                     {/* Attendance Certificate */}
                     <div className={`p-6 rounded-3xl border-2 transition-all ${selectedStudent ? 'bg-white border-primary/10 hover:border-primary cursor-pointer' : 'bg-gray-50/50 border-gray-100 opacity-50 grayscale'}`}>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                 <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Attendance Record</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase">Compliance Verified</p>
                              </div>
                           </div>
                           <Button 
                              onClick={handleGenerateAttendance} 
                              disabled={!selectedStudent || isGenerating}
                              className="h-10 px-6 gap-2 bg-gray-900 rounded-xl text-[9px] font-black uppercase tracking-widest"
                              isLoading={isGenerating}
                           >
                              <Download className="w-4 h-4" /> Export PDF
                           </Button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                           Certification of presence percentage and academic regularity for formal submissions.
                        </p>
                     </div>
                  </div>
               </div>
            </GlassCard>

            {/* Security Notice */}
            <GlassCard className="p-6 border-rose-100 bg-rose-50/30">
                <div className="flex gap-4">
                   <div className="p-3 bg-white rounded-2xl shadow-sm border border-rose-100">
                      <ShieldCheck className="w-6 h-6 text-rose-600" />
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-1">Authenticity Safeguard</h4>
                      <p className="text-[10px] text-rose-600 font-bold leading-relaxed opacity-80 uppercase tracking-tight">
                         Documents are generated with embedded institutional identifiers. Ensure the Principal's signature name is correctly set in Global Settings.
                      </p>
                   </div>
                </div>
            </GlassCard>
         </div>
      </div>
    </div>
  );
}
