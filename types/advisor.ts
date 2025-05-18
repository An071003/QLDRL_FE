import { Faculty as FacultyType } from './faculty';
import { Class as ClassType } from './class';

export interface Advisor {
  id: number;
  name: string | null;
  user_id: number | null;
  faculty_id: number | null;
  phone?: string | null;
  Faculty?: FacultyType & {
    faculty_name?: string;
  };
  Class?: ClassType[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Faculty {
  id: number;
  name: string;
  faculty_abbr?: string;
} 