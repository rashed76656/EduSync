import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useStudents } from '../../hooks/useStudents';
import type { Student } from '../../types';

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
  status: z.enum(['active', 'inactive', 'dropped']),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess?: () => void;
}

export default function EditStudentModal({ isOpen, onClose, student, onSuccess }: EditStudentModalProps) {
  const { updateStudent } = useStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      ...student,
      // Handle Date to String conversion for the input[type=date]
      dateOfBirth: student.dateOfBirth instanceof Date 
        ? student.dateOfBirth.toISOString().split('T')[0] 
        : (student.dateOfBirth as any)?.seconds 
          ? new Date((student.dateOfBirth as any).seconds * 1000).toISOString().split('T')[0]
          : student.dateOfBirth as any
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        ...student,
        dateOfBirth: student.dateOfBirth instanceof Date 
          ? student.dateOfBirth.toISOString().split('T')[0] 
          : (student.dateOfBirth as any)?.seconds 
            ? new Date((student.dateOfBirth as any).seconds * 1000).toISOString().split('T')[0]
            : student.dateOfBirth as any
      });
    }
  }, [isOpen, student, reset]);

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    try {
      await updateStudent(student.id, {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
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
      title="Edit Student Profile"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-3 scrollbar-hide">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Academic Information</h3>
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
              label="Status"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'dropped', label: 'Dropped Out' },
              ]}
            />
          </div>
          <Input label="Session" {...register('session')} error={errors.session?.message} />

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 pt-4">Personal Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full Name" {...register('name')} error={errors.name?.message} />
            <Input label="Date of Birth" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
            <Input label="Roll Number" {...register('roll')} error={errors.roll?.message} />
            <Input label="Registration" {...register('registration')} error={errors.registration?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
             <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
             <Input label="Blood Group" {...register('bloodGroup')} error={errors.bloodGroup?.message} />
             <Input label="NID/Birth Cert" {...register('nid')} error={errors.nid?.message} />
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 pt-4">Guardian & Address</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Guardian Name" {...register('guardianName')} error={errors.guardianName?.message} />
            <Input label="Guardian Phone" {...register('guardianPhone')} error={errors.guardianPhone?.message} />
          </div>
          <Input label="Address" {...register('address')} error={errors.address?.message} />
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100 gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Discard Changes</Button>
          <Button type="submit" isLoading={isSubmitting}>Update Profile ✓</Button>
        </div>
      </form>
    </Modal>
  );
}
