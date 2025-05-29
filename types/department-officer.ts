export interface DepartmentOfficer {
  id: number;
  officer_name: string;
  officer_phone: string;
  User?: {
    email: string;
    user_name: string;
  };
} 