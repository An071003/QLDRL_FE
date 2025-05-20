import { Faculty as FacultyType } from './faculty';
import { Class as ClassType } from './class';

export interface User {
  id?: number;
  email?: string;
  user_name?: string;
}

export interface Advisor {
  id: number;
  name: string | null;
  user_id: number | null;
  faculty_id: number | null;
  phone?: string | null;
  Faculty?: FacultyType & {
    faculty_name?: string;
  };
  Classes?: ClassType[];
  Class?: ClassType[]; // For backward compatibility
  User?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface Faculty {
  id: number;
  name: string;
  faculty_abbr?: string;
} 