export interface Student {
    id: string;
    student_name: string;
    faculty: string;
    course: string;
    class: string;
    status: 'none'| 'disciplined',
    sumscore: number;
  }