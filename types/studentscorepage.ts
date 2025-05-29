export interface Activity {
  id: number;
  name: string;
  point: number;
  has_participated: boolean;
  awarded_score: number;
  note: string;
  status: string;
  quantity: number;
};

export interface Campaign {
  id: number;
  name: string;
  max_score: number;
  total_score: number;
  activities: Activity[];
};

export interface Criteria {
  id: number;
  name: string;
  max_score: number;
  total_score: number;
  campaigns: Campaign[];
};

export interface Semester {
  id: number;
  semester_no: number;
  academic_year: number;
};

export interface ScoreData {
  criteria: Criteria[];
  sumscore: number;
};
