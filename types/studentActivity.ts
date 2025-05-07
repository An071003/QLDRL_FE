export interface StudentActivity {
    student_id: number;
    student_name: string;
    class: string;
    participated: boolean;
    awarded_score: number;
    activity_id: number;
    activity_name: string;
    point: number;
    status: 'ongoing' | 'expired';
    campaign_name: string;
    semester: string;
    semester_name: string;
    start_year: number;
    end_year: number;
  }