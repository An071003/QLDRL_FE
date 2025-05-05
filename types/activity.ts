export interface Activity {
  id: number;
  name: string;
  point: number;
  is_negative: boolean;
  negativescore: number;
  status: "ongoing" | "expired";
  number_students: number;
  campaign_id: number;
  campaign_name: string;
  semester: number;
  semester_name: string;
  start_year: number;
  end_year: number;
}
