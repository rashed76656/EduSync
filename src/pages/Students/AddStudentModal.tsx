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
  const { addStudent } = useStudents();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    try {
      await addStudent({
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
        createdBy: user?.uid || 'unknown'
      });
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

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button type="submit" isLoading={isSubmitting}>Save Student ✓</Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
