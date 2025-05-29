// Common interfaces for student components

export interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  classification: string;
  status: 'none' | 'disciplined';
}

export interface StudentProfile {
  student_id: string;
  student_name: string;
  phone?: string;
  birthdate?: string;
  classification?: string;
  status: 'none' | 'disciplined';
  sumscore: number;
  Faculty?: {
    id: number;
    name: string;
    faculty_abbr: string;
  };
  Class?: {
    id: number;
    name: string;
  };
  User?: {
    email: string;
  };
}

export interface StudentSummary {
  sumscore: number;
  classification: string;
}

// Utility functions
export const getClassificationColor = (classification?: string) => {
  switch (classification?.toLowerCase()) {
    case 'xuất sắc': return 'gold';
    case 'giỏi': return 'green';
    case 'khá': return 'blue';
    case 'trung bình': return 'orange';
    case 'yếu': return 'red';
    default: return 'default';
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 90) return '#faad14';
  if (score >= 80) return '#52c41a';
  if (score >= 65) return '#1890ff';
  if (score >= 50) return '#fa8c16';
  return '#f5222d';
};

export const getStatusColor = (status: string) => {
  return status === 'disciplined' ? 'red' : 'green';
};

export const getStatusText = (status: string) => {
  return status === 'disciplined' ? 'Đang bị kỷ luật' : 'Bình thường';
}; 