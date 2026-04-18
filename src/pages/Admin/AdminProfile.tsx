import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Shield, 
  Save, 
  UploadCloud, 
  RefreshCcw, 
  CheckCircle2, 
  LogOut,
  Fingerprint,
  Activity
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { 
  updatePassword, 
  updateProfile, 
  EmailAuthProvider, 
  linkWithCredential
} from 'firebase/auth';
import toast from 'react-hot-toast';

export default function AdminProfile() {
  const { user, role, unit, phone: storePhone, setProfileData } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'identity' | 'security'>('identity');

  // Provider checks
  const hasPasswordProvider = auth.currentUser?.providerData.some(p => p.providerId === 'password');
  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  // Form States
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileUnit, setProfileUnit] = useState(unit || '');
  const [profilePhone, setProfilePhone] = useState(storePhone || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [requiresReauth, setRequiresReauth] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setProfilePhotoUrl(user?.photoURL || '');
    setProfileUnit(unit || '');
    setProfilePhone(storePhone || '');
  }, [user, unit, storePhone]);

  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !user) return;
    
    setIsUpdating(true);
    try {
      await updateProfile(auth.currentUser, { 
        displayName,
        photoURL: profilePhotoUrl
      });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName,
        photoURL: profilePhotoUrl,
        unit: profileUnit,
        phone: profilePhone,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setProfileData({ unit: profileUnit, phone: profilePhone });
      toast.success('Admin identity synchronized!');
    } catch (err) {
      toast.error('Failed to update meta-identity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setProfilePhotoUrl(url);
      toast.success('Photo ready for synchronization');
    } catch (err) {
      toast.error('Identity capture failed');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      toast.error('Secret codes do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (!hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(currentUser.email!, newPassword);
        await linkWithCredential(currentUser, credential);
      } else {
        await updatePassword(currentUser, newPassword);
      }
      toast.success('Security credentials updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setRequiresReauth(true);
      } else {
        toast.error('Security update failed');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display tracking-tight uppercase italic">
            My <span className="text-rose-600">Profile</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">
            Personalize your administrative presence and security.
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('identity')}
             className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'identity' ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' : 'bg-white text-gray-500 hover:bg-rose-50'}`}
           >
             Identity
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' : 'bg-white text-gray-500 hover:bg-rose-50'}`}
           >
             Security
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Identity Overview */}
         <div className="lg:col-span-1 space-y-8">
            <GlassCard className="p-8 border-white/50 bg-white/40 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Fingerprint className="w-32 h-32 text-rose-600" />
               </div>
               
               <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative mb-6">
                     <div className="w-32 h-32 rounded-[40px] bg-white border-2 border-rose-100 flex items-center justify-center overflow-hidden shadow-2xl ring-8 ring-rose-50 group-hover:scale-105 transition-transform duration-500">
                        <img 
                          src={profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                          className="w-full h-full object-cover" 
                        />
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                             <RefreshCcw className="w-8 h-8 text-rose-600 animate-spin" />
                          </div>
                        )}
                     </div>
                     <label className="absolute -bottom-2 -right-2 p-3 bg-rose-600 text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform ring-4 ring-white">
                        <UploadCloud className="w-5 h-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                     </label>
                  </div>

                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{user?.displayName || 'Administrator'}</h2>
                  <div className="flex items-center gap-2 mt-2">
                     <Badge variant="success" className="text-[9px] font-black uppercase tracking-[0.2em] px-3">{role}</Badge>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 rounded-lg text-rose-600">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span className="text-[8px] font-black uppercase">Active Session</span>
                     </div>
                  </div>

                  <div className="w-full mt-8 space-y-4 pt-8 border-t border-gray-100">
                     <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Session Start</span>
                        <span className="text-gray-900">Today, 2:45 AM</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Access Level</span>
                        <span className="text-rose-600">Full Terminal</span>
                     </div>
                  </div>

                  <button 
                    onClick={() => auth.signOut()}
                    className="mt-10 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gray-900 text-white hover:bg-black transition-all shadow-xl shadow-gray-200 text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                     <LogOut className="w-4 h-4" /> Terminate Session
                  </button>
               </div>
            </GlassCard>
         </div>

         {/* Form Section */}
         <div className="lg:col-span-2">
            <GlassCard className="p-10 border-white/50 bg-white/40 shadow-2xl relative">
               {activeTab === 'identity' ? (
                 <form onSubmit={handleUpdateIdentity} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                          <UserIcon className="w-6 h-6" />
                       </div>
                       <div>
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Identity Metadata</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage your public markers.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Legal Designation</label>
                          <Input 
                            placeholder="Full official name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="h-14 bg-white/60 border-0 rounded-2xl px-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-rose-500"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Terminal Email</label>
                          <Input 
                            value={user?.email || ''} 
                            disabled
                            className="h-14 bg-gray-50 border-0 rounded-2xl px-6 text-sm font-bold shadow-inner opacity-60"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Assigned Unit</label>
                          <Input 
                            placeholder="e.g. Administration"
                            value={profileUnit}
                            onChange={(e) => setProfileUnit(e.target.value)}
                            className="h-14 bg-white/60 border-0 rounded-2xl px-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-rose-500"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Secure Contact</label>
                          <Input 
                            placeholder="+880 1XXX XXXXXX"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="h-14 bg-white/60 border-0 rounded-2xl px-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-rose-500"
                          />
                       </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                       <Button type="submit" className="h-14 px-12 rounded-2xl bg-rose-600 shadow-2xl shadow-rose-200 uppercase font-black text-[11px] tracking-[0.2em]" isLoading={isUpdating}>
                          <Save className="w-5 h-5 mr-3" /> Sync Identity
                       </Button>
                    </div>
                 </form>
               ) : (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                          <Shield className="w-6 h-6" />
                       </div>
                       <div>
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Access Control</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Synchronize security credentials.</p>
                       </div>
                    </div>

                    {requiresReauth ? (
                       <div className="p-10 bg-indigo-50 rounded-[40px] border border-indigo-100 flex flex-col items-center text-center gap-6">
                          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl text-indigo-600">
                             <RefreshCcw className="w-10 h-10 animate-spin-slow" />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Identity Re-Verification</h4>
                             <p className="text-xs text-indigo-600 font-medium mt-1 uppercase tracking-widest max-w-[280px]">
                                Secure timeout reached. Verify your credentials to continue.
                             </p>
                          </div>
                          <Button onClick={() => window.location.reload()} className="h-12 px-10 bg-indigo-600 rounded-2xl uppercase font-black text-[10px] tracking-widest">
                             Verify Now
                          </Button>
                       </div>
                    ) : (
                       <form onSubmit={handleUpdatePassword} className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Access Code</label>
                                <Input 
                                  type="password"
                                  placeholder="••••••••"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="h-14 bg-white/60 border-0 rounded-2xl px-6 text-sm font-bold shadow-sm"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm Access Code</label>
                                <Input 
                                  type="password"
                                  placeholder="••••••••"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="h-14 bg-white/60 border-0 rounded-2xl px-6 text-sm font-bold shadow-sm"
                                />
                             </div>
                          </div>
                          <div className="pt-6 border-t border-gray-100 flex justify-end">
                             <Button type="submit" className="h-14 px-12 rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-100 uppercase font-black text-[11px] tracking-[0.2em]" isLoading={isUpdatingPassword}>
                                <Save className="w-5 h-5 mr-3" /> Update Credentials
                             </Button>
                          </div>
                       </form>
                    )}

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                       <div className="flex gap-4">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                             <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Primary Authentication</p>
                             <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">
                                {isGoogleUser ? 'Linked to Google SSO Protocol' : 'Standard Email/Pass Secret'}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </GlassCard>
         </div>
      </div>
    </div>
  );
}
