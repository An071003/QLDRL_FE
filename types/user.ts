interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'lecturer';
  created_at: string;
}