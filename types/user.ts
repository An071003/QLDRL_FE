export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'lecturer';
  created_at: string;
}

export type NewUser = Omit<User, 'id' | 'created_at'>;