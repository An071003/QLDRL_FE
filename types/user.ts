export interface User {
  id: number;
  user_name: string;
  email: string;
  role_id: number;
  faculty_id?: number;
  class_id?: number;
  created_at: string;
  Role: {
    name: string; 
  };
  Faculty?: {
    id: number;
    name: string;
    faculty_abbr: string;
  };
  Class?: {
    id: number;
    name: string;
  };
}

export type NewUser = {
  user_name: string;
  email: string;
  role_id: number | "";
  faculty_id?: number | "";
  class_id?: number | "";
};