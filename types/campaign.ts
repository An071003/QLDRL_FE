export interface Campaign {
    id: number;
    name: string;
    max_score: number;
    criteria_id: number;
    semester: number;
    semester_name: string;
    start_year: number;
    end_year: number;
    is_negative: boolean;
    negativescore: number;
  }
  