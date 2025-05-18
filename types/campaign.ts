export interface Campaign {
    id: number;
    name: string;
    max_score: number;
    criteria_id: number;
    semester_no?: number;
    academic_year?: number;
    is_negative?: boolean;
    negativescore?: number;
    created_by?: number;
    campaign_max_score?: number;
    criteria_name?: string;
    criteria_max_score?: number;
    semester?: number;
    semester_name?: string;
    start_year?: number;
    end_year?: number;
  }
  