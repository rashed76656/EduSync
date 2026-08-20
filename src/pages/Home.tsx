import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

import { auth, googleProvider, db } from '../lib/firebase';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { GraduationCap } from 'lucide-react';

// ─── Role-based redirect helper ─────────────────────────────
function redirectByRole(role: string, navigate: ReturnType<typeof useNavigate>) {
  switch (role) {
    case 'admin':           navigate('/admin'); break;
    case 'teacher':         navigate('/dashboard'); break;
    case 'account_manager': navigate('/account'); break;
    case 'student':         navigate('/student'); break;
    default:                navigate('/dashboard');
  }
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Student login state
  const [studentEmail, setStudentEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'student'>('staff');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const profile = {
          uid: user.uid,
          name: user.displayName || 'Unknown Teacher',
          email: user.email,
          photoURL: user.photoURL || '',
          role: 'teacher' as const,
          department: 'Unassigned',
          joinedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };
        await setDoc(userRef, profile);
        toast.success(`Welcome to EduSync, ${profile.name}!`);
        navigate('/dashboard');
      } else {
        const userData = userSnap.data();
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        toast.success(`Welcome back, ${userData.name || user.displayName || 'User'}!`);
        redirectByRole(userData.role, navigate);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Update last login
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        toast.success('Signed in successfully!');
        redirectByRole(userData?.role || 'teacher', navigate);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail || !secretCode) {
      toast.error("Please enter both email and secret code");
      return;
    }

    setIsStudentLoading(true);
    try {
      // Students use signInWithEmailAndPassword where password = secretCode
      await signInWithEmailAndPassword(auth, studentEmail, secretCode);
      
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await auth.signOut();
          toast.error('Student profile not found. Contact your teacher.');
          return;
        }
        
        const userData = userSnap.data();
        
        // Verify this is actually a student account
        if (userData.role !== 'student') {
          toast.error('This is not a student account. Use the staff login above.');
          await auth.signOut();
          return;
        }

        // Check if blocked
        if (userData.status === 'blocked') {
          await auth.signOut();
          toast.error('Your account has been suspended. Contact your teacher.');
          return;
        }

        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        toast.success(`Welcome, ${userData.name || 'Student'}!`);
        navigate('/student');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or secret code');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsStudentLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col justify-center items-center overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-brand opacity-90 mixing-blend" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-secondary/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000" />
        
        {/* Decorative Floating Cards */}
        <GlassCard className="absolute top-[20%] left-[15%] w-48 p-4 rotate-[-6deg] bg-white/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xl">👨‍🎓</span>
            </div>
            <div className="h-4 w-20 bg-white/60 rounded" />
          </div>
          <div className="h-8 w-16 bg-white/80 rounded mb-2" />
          <div className="h-2 w-full bg-white/40 rounded" />
        </GlassCard>

        <GlassCard className="absolute bottom-[25%] right-[15%] w-56 p-5 rotate-[4deg] bg-white/40">
           <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success font-bold">✓</span>
            </div>
            <div>
              <div className="h-3 w-24 bg-white/60 rounded mb-2" />
              <div className="h-2 w-16 bg-white/40 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded bg-white/60" />
            <div className="h-8 w-8 rounded bg-white/60" />
            <div className="h-8 w-8 rounded bg-white/60" />
          </div>
        </GlassCard>

        {/* Branding */}
        <div className="relative z-10 text-center px-8">
          <div className="flex justify-center mb-6">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6 leading-tight drop-shadow-sm">
            Smart Teaching <br /> Starts Here
          </h1>
          <p className="text-xl text-gray-800 font-medium max-w-lg mx-auto backdrop-blur-md bg-white/30 py-2 px-6 rounded-full border border-white/40">
            স্মার্ট এডুকেশন — ডিজিটাল শিক্ষক পোর্টাল
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white/50 backdrop-blur-md relative z-10">
        <GlassCard className="w-full max-w-[420px] p-8 md:p-10 !bg-white/80 !backdrop-blur-[30px] border-white/60 shadow-[0_8px_32px_rgba(30,27,75,0.05)]">
          <div className="text-center mb-6">
            <div className="lg:hidden flex justify-center mb-4">
              <Logo className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Welcome Back 👋</h2>
            <p className="text-gray-500">EduSync পোর্টালে লগইন করুন</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-gray-100/50 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === 'staff'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Staff Login
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student
            </button>
          </div>

          {/* Staff Login Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Button 
                variant="secondary" 
                className="w-full flex items-center justify-center gap-3 h-12 text-gray-700 bg-white hover:bg-gray-50 border-gray-200"
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-sm text-gray-400">অথবা ইমেইল দিয়ে</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
                <Input
                  type="email"
                  placeholder="teacher@institute.edu.bd"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <a href="#" className="text-sm text-primary hover:text-primary-dark select-none">
                      Forgot Password?
                    </a>
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full h-12 mt-2" isLoading={isLoading}>
                  Sign In
                </Button>
              </form>
            </div>
          )}

          {/* Student Login Tab */}
          {activeTab === 'student' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl border border-sky-100">
                <GraduationCap className="w-8 h-8 text-sky-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-sky-900">Student Portal Access</p>
                  <p className="text-[10px] text-sky-600 mt-0.5">শিক্ষক প্রদত্ত Email ও Secret Code দিয়ে লগইন করুন</p>
                </div>
              </div>

              <form onSubmit={handleStudentLogin} className="space-y-4 text-left">
                <Input
                  type="email"
                  placeholder="student@example.com"
                  label="Student Email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Enter secret code"
                  label="Secret Code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 mt-2 bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200" 
                  isLoading={isStudentLoading}
                >
                  Login to Student Portal
                </Button>
              </form>

              <p className="text-[10px] text-center text-gray-400 leading-relaxed">
                Secret code পেতে আপনার Teacher/Department এর সাথে যোগাযোগ করুন।
                <br />Code হারিয়ে ফেললে নতুন code generate করতে বলুন।
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} EduSync Academic Platform
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
