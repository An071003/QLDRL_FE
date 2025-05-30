import { Faculty } from './faculty';

export interface Class {
  id: number;
  name: string;
  faculty_id: number;
  cohort: string;
  student_count?: number;
  class_leader_id?: string | null;
  advisor_id?: number | null;
  createdAt?: string;
  updatedAt?: string;
  Faculty?: Faculty;
} 