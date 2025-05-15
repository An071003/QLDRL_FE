export interface Student {
    student_id: string;
    user_id: number;
    student_name: string | null;
    faculty_id: number | null;
    class_id: number | null;
    birthdate: string | null;
    phone: string | null;
    classification: string | null;
    status: 'none' | 'disciplined';
    sumscore: number;
  }