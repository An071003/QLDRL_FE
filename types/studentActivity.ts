export interface StudentActivity {
  activity_id: number;
  student_id: string;
  student_name: string;
  Class?: {
    name: string;
  };
  Activity?: {
    id: number;
    name: string;
    point: number;
    status: 'ongoing' | 'expired';
    Campaign?: {
      name: string;
      semester_no: number;
      academic_year: string;
    };
  };
  participated: boolean;
  awarded_score: number;
  created_at: string;
  register_id: number;
  Student?: {
    student_id: string;
    student_name: string;
    Class?: {
      name: string;
    };
  };
}