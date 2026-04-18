import { useState, useEffect } from 'react';
import { 
  Building2, 
  UploadCloud, 
  Save, 
  RefreshCcw,
  Plus,
  Trash2,
  LayoutGrid,
  ShieldCheck
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../../lib/cloudinary';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user, branding, setBranding } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'departments' | 'system'>('branding');

  const [brandingForm, setBrandingForm] = useState({
    name: branding?.name || '',
    shortName: branding?.shortName || '',
    logoUrl: branding?.logoUrl || '',
    address: branding?.address || '',
    phone: branding?.phone || '',
    email: branding?.email || '',
    principalName: branding?.principalName || '',
    website: branding?.website || ''
  });

  // Sync form with store
  useEffect(() => {
    if (branding) {
      setBrandingForm({
        name: branding.name || '',
        shortName: branding.shortName || '',
        logoUrl: branding.logoUrl || '',
        address: branding.address || '',
        phone: branding.phone || '',
        email: branding.email || '',
        principalName: branding.principalName || '',
        website: branding.website || ''
      });
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setBrandingForm(prev => ({ ...prev, logoUrl: url }));
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error('Upload failed. Check Cloudinary settings.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        branding: brandingForm,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setBranding(brandingForm as any);
      toast.success('Institutional branding synchronized!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'branding', label: 'Identity & Branding', icon: Building2 },
    { id: 'departments', label: 'Department Manager', icon: LayoutGrid },
    { id: 'system', label: 'System Control', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display tracking-tight uppercase italic">
            Global <span className="text-rose-600">Configuration</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-bold uppercase tracking-widest">
            Manage your institute's digital core and identity.
          </p>
        </div>
        <div className="flex gap-2">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                 activeTab === tab.id 
                   ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' 
                   : 'bg-white text-gray-500 hover:text-rose-600 border border-gray-100'
               }`}
             >
               <tab.icon className="w-3.5 h-3.5" />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="max-w-5xl">
         {activeTab === 'branding' && (
           <GlassCard className="p-8 border-white/50 bg-white/40 shadow-2xl shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Building2 className="w-64 h-64 text-rose-600" />
              </div>
              
              <div className="relative z-10">
                <div className="mb-8">
                   <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Institutional Assets</h2>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure logos and official titles.</p>
                </div>

                <form onSubmit={handleSaveBranding} className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                     <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                           <div className="w-40 h-40 rounded-[40px] bg-white border-2 border-dashed border-rose-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-rose-400 transition-all duration-500 ring-8 ring-rose-50/50">
                             {brandingForm.logoUrl ? (
                               <img src={brandingForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                             ) : (
                               <Building2 className="w-12 h-12 text-rose-200" />
                             )}
                             {isUploading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                   <RefreshCcw className="w-8 h-8 text-rose-600 animate-spin" />
                                </div>
                             )}
                           </div>
                           <label className="absolute -bottom-2 -right-2 p-3 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-200 cursor-pointer hover:scale-110 transition-transform ring-4 ring-white">
                              <UploadCloud className="w-5 h-5" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                           </label>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2">Recommended: Transparent PNG</p>
                     </div>

                     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                           label="Institute Name" 
                           placeholder="Full Institutional Title"
                           value={brandingForm.name}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, name: e.target.value }))}
                           required
                        />
                        <Input 
                           label="Shorthand" 
                           placeholder="Short Name (e.g. RPI)"
                           value={brandingForm.shortName}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, shortName: e.target.value }))}
                        />
                        <Input 
                           label="Campus Address" 
                           placeholder="Full geographical location"
                           value={brandingForm.address}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, address: e.target.value }))}
                        />
                        <Input 
                           label="Official Web Link" 
                           placeholder="https://institute.edu.bd"
                           value={brandingForm.website}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, website: e.target.value }))}
                        />
                        <Input 
                           label="Contact Email" 
                           placeholder="admin@institute.edu"
                           value={brandingForm.email}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Input 
                           label="Contact Support" 
                           placeholder="+880 1XXX XXXXXX"
                           value={brandingForm.phone}
                           onChange={(e) => setBrandingForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                        <div className="md:col-span-2">
                           <Input 
                              label="Principal (Primary Signatory)" 
                              placeholder="Name of the Head of Institution"
                              value={brandingForm.principalName}
                              onChange={(e) => setBrandingForm(prev => ({ ...prev, principalName: e.target.value }))}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Button type="submit" className="gap-3 h-14 px-12 rounded-[22px] shadow-2xl shadow-rose-200 bg-rose-600 hover:bg-rose-700 uppercase font-black text-[11px] tracking-[0.2em]" isLoading={isSaving}>
                       <Save className="w-5 h-5" /> Synchronize Identity Assets
                    </Button>
                  </div>
                </form>
              </div>
           </GlassCard>
         )}

         {activeTab === 'departments' && (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <GlassCard className="p-8 border-white/50 bg-white/40 shadow-xl shadow-primary/5">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Active Technologies</h2>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage the departments available in standard curricula.</p>
                    </div>
                    <Button className="h-10 px-6 gap-2 bg-gray-900 hover:bg-black uppercase font-black text-[9px] tracking-widest rounded-xl">
                       <Plus className="w-4 h-4" /> Add New Technology
                    </Button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['Computer Science', 'Civil Engineering', 'Electrical Engineering', 'Electronics', 'Mechanical', 'Power'].map((dept) => (
                      <div key={dept} className="p-4 bg-white/60 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
                         <div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{dept}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Active Department</p>
                         </div>
                         <button className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    ))}
                 </div>
              </GlassCard>
           </div>
         )}

         {activeTab === 'system' && (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <GlassCard className="p-8 border-rose-100 bg-rose-50/30 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck className="w-32 h-32 text-rose-600" />
                 </div>
                 <div className="relative z-10">
                    <h2 className="text-lg font-black text-rose-900 uppercase tracking-tight">Privileged System Control</h2>
                    <p className="text-xs text-rose-600 font-bold uppercase tracking-widest mt-1">High-risk administrative operations.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                       <div className="p-6 bg-white/80 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Global Data Flush</h3>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                             Clear all archived attendance and notice data from previous semesters. This action is irreversible.
                          </p>
                          <Button variant="secondary" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-[9px] font-black uppercase tracking-widest h-10">
                             Purge Legacy Data
                          </Button>
                       </div>
                       <div className="p-6 bg-white/80 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Curriculum Sync</h3>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                             Force re-sync of BTEB global subjects across all teacher workspaces.
                          </p>
                          <Button variant="secondary" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[9px] font-black uppercase tracking-widest h-10">
                             Force Curriculum Sync
                          </Button>
                       </div>
                    </div>
                 </div>
              </GlassCard>
           </div>
         )}
      </div>
    </div>
  );
}
