import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useStudents } from '../../hooks/useStudents';
import { useAuthStore } from '../../store/authStore';
import { generateSecretCode } from '../../utils/secretCode';
import { KeyRound, RefreshCw, Copy, Check, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const studentSchema = z.object({
  semester: z.enum(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']),
  department: z.enum(['CST', 'EET', 'CET', 'MT', 'RAC', 'AT', 'FT', 'ET', 'PT']),
  shift: z.enum(['Morning', 'Day']),
  group: z.enum(['A', 'B', 'C']),
  session: z.string().min(1, 'Session is required'),
  name: z.string().min(2, 'Name is required'),
  roll: z.string().min(1, 'Roll is required'),
  registration: z.string().min(1, 'Registration is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  nid: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [step, setStep] = useState(1);
  const { addStudent, setupPortalAccess } = useStudents();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Portal access state
  const [enablePortal, setEnablePortal] = useState(false);
  const [portalEmail, setPortalEmail] = useState('');
  const [secretCode, setSecretCode] = useState(generateSecretCode());
  const [codeCopied, setCodeCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      semester: '1st',
      department: 'CST',
      shift: 'Morning',
      group: 'A',
      session: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
    }
  });

  const nextStep = async () => {
    // Validate first step before proceeding
    const isValid = await trigger(['semester', 'department', 'shift', 'group', 'session']);
    if (isValid) setStep(2);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(secretCode);
      setCodeCopied(true);
      toast.success('Secret code copied!');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleRegenerateCode = () => {
    setSecretCode(generateSecretCode());
    setCodeCopied(false);
  };

  const onSubmit = async (data: StudentFormData) => {
    // Validate portal email if portal is enabled
    if (enablePortal && !portalEmail.trim()) {
      toast.error('Student email is required for portal access');
      return;
    }
    if (enablePortal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portalEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create student record
      const studentId = await addStudent({
        name: data.name,
        roll: data.roll,
        registration: data.registration,
        semester: data.semester,
        department: data.department,
        shift: data.shift,
        group: data.group,
        session: data.session,
        phone: data.phone || '',
        guardianName: data.guardianName || '',
        guardianPhone: data.guardianPhone || '',
        address: data.address || '',
        bloodGroup: data.bloodGroup || '',
        dateOfBirth: new Date(data.dateOfBirth),
        nid: data.nid || '',
        status: 'active',
        createdBy: user?.uid || 'unknown',
        hasPortalAccess: false,
        examEligible: true,
        ...(enablePortal ? { email: portalEmail, secretCode } : {}),
      });

      // Step 2: If portal access enabled, create Firebase Auth account
      if (enablePortal && studentId) {
        try {
          await setupPortalAccess(
            studentId,
            data.name,
            portalEmail,
            secretCode,
            data.roll,
            data.registration,
            data.semester,
            data.department,
          );
        } catch (portalErr: any) {
          // Student was created but portal setup failed
          toast.error('Student added but portal setup failed. You can retry from the student detail page.');
        }
      }

      // Reset portal state
      setEnablePortal(false);
      setPortalEmail('');
      setSecretCode(generateSecretCode());
      setStep(1);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      // toast is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New Student — Step ${step} of 2`}
    >
      <div className="mb-6 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Semester"
                {...register('semester')}
                error={errors.semester?.message}
                options={[
                  { value: '1st', label: '1st Semester' },
                  { value: '2nd', label: '2nd Semester' },
                  { value: '3rd', label: '3rd Semester' },
                  { value: '4th', label: '4th Semester' },
                  { value: '5th', label: '5th Semester' },
                  { value: '6th', label: '6th Semester' },
                  { value: '7th', label: '7th Semester' },
                  { value: '8th', label: '8th Semester' },
                ]}
              />
              <Select
                label="Department"
                {...register('department')}
                error={errors.department?.message}
                options={[
                  { value: 'CST', label: 'Computer Science & Tech' },
                  { value: 'EET', label: 'Electrical Engineering' },
                  { value: 'CET', label: 'Civil Engineering' },
                  { value: 'MT', label: 'Mechanical Tech' },
                  { value: 'ET', label: 'Electronics Tech' },
                  { value: 'PT', label: 'Power Tech' },
                ]}
              />
              <Select
                label="Shift"
                {...register('shift')}
                error={errors.shift?.message}
                options={[
                  { value: 'Morning', label: 'Morning Shift' },
                  { value: 'Day', label: 'Day Shift' },
                ]}
              />
              <Select
                label="Group"
                {...register('group')}
                error={errors.group?.message}
                options={[
                  { value: 'A', label: 'Group A' },
                  { value: 'B', label: 'Group B' },
                  { value: 'C', label: 'Group C' },
                ]}
              />
            </div>
            <Input
              label="Session"
              placeholder="e.g. 2023-2024"
              {...register('session')}
              error={errors.session?.message}
            />
            
            <div className="flex justify-end pt-4 gap-3 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="button" onClick={nextStep}>Next Step →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                placeholder="Student full name"
                {...register('name')}
                error={errors.name?.message}
              />
              <Input
                label="Date of Birth *"
                type="date"
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
              />
              <Input
                label="Roll Number *"
                placeholder="e.g. 102456"
                {...register('roll')}
                error={errors.roll?.message}
              />
              <Input
                label="Registration No *"
                placeholder="e.g. 1502XXXXX"
                {...register('registration')}
                error={errors.registration?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Phone Number"
                placeholder="01XXXXXXXXX"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Input
                label="Blood Group"
                placeholder="e.g. A+"
                {...register('bloodGroup')}
                error={errors.bloodGroup?.message}
              />
              <Input
                label="NID/Birth Cert"
                placeholder="Optional"
                {...register('nid')}
                error={errors.nid?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Guardian Name"
                placeholder="Father/Mother name"
                {...register('guardianName')}
                error={errors.guardianName?.message}
              />
              <Input
                label="Guardian Phone"
                placeholder="01XXXXXXXXX"
                {...register('guardianPhone')}
                error={errors.guardianPhone?.message}
              />
            </div>
            
            <Input
              label="Address"
              placeholder="Present address"
              {...register('address')}
              error={errors.address?.message}
            />

            {/* ─── Portal Access Section ─────────────────────────── */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                  <span className="text-sm font-bold text-gray-700">Student Portal Access</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnablePortal(!enablePortal)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    enablePortal ? 'bg-sky-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      enablePortal ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enablePortal && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <KeyRound className="w-5 h-5 text-sky-500 shrink-0" />
                    <p className="text-[11px] text-sky-700 leading-relaxed">
                      Portal access দিলে student Email ও Secret Code দিয়ে নিজের dashboard এ login করতে পারবে।
                    </p>
                  </div>

                  <Input
                    label="Student Email *"
                    type="email"
                    placeholder="student@example.com"
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Secret Code</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={secretCode}
                          onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono font-bold text-gray-900 tracking-[0.3em] focus:border-sky-300 focus:ring-1 focus:ring-sky-300 outline-none transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRegenerateCode}
                        className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Generate new code"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className={`p-2.5 rounded-xl border transition-all ${
                          codeCopied 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700'
                        }`}
                        title="Copy code"
                      >
                        {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                      ⓘ এই code টি student কে শেয়ার করুন — এটি তার login password হিসেবে কাজ করবে
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button type="submit" isLoading={isSubmitting}>
                {enablePortal ? 'Save & Setup Portal ✓' : 'Save Student ✓'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
