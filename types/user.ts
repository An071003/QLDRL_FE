export interface User {
  id: number;
  user_name: string;
  email: string;
  role_id: number;
  created_at: string;
  Role: {
    name: string; 
  };
}

export type NewUser = {
  user_name: string;
  email: string;
  role_id: number | "";
};