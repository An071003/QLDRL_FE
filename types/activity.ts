export interface Activity {
  id: number;
  name: string;
  point: number;
  max_participants?: number;
  number_students: number;
  status: "ongoing" | "expired";
  registration_start?: string;
  registration_end?: string;
  approver_id?: number | null;
  approved_at?: string | null;
  created_by?: number;
  created_at?: string;
  is_negative?: boolean;
  negativescore?: number;
  campaign_id: number;
  campaign_name?: string;
  semester?: number;
  semester_name?: string;
  start_year?: number;
  end_year?: number;
  Campaign?: {
    name: string;
    semester_no: number;
    academic_year: string;
  };
  Creator?: {
    id: number;
    user_name: string;
    email: string;
  };
  Approver?: {
    id: number;
    user_name: string;
    email: string;
  };
}
