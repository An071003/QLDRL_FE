'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface Criteria {
  id: number;
  name: string;
  max_score: number;
  total_score: number;
  campaigns: Campaign[];
}

interface Campaign {
  id: number;
  name: string;
  max_score: number;
  total_score: number;
  activities: Activity[];
}

interface Activity {
  id: number;
  name: string;
  point: number;
  has_participated: boolean;
  awarded_score: number;
  note: string;
  status: string;
  quantity: number;
}

// Backend data types
interface BackendActivity {
  activity_id: number;
  name: string;
  point: number;
  has_participated: boolean;
  awarded_score: number;
  status: string;
  max_participants: number;
}

interface BackendSubCriteria {
  id: number;
  name: string;
  max_score: number;
  total_score: number;
  activities: BackendActivity[];
}

interface BackendCriteria {
  id: number;
  name: string;
  max_score: number;
  total_score: number;
  subcriteria: BackendSubCriteria[];
}

interface CampaignData {
  id: number;
  name: string;
  semester_no: number;
  academic_year: number;
  criteria_id: number;
  max_score: number;
}

interface CampaignResponse {
  id: number;
  name: string;
  semester_no: number;
  academic_year: number;
  criteria_id: number;
  max_score: number;
}

interface StudentDataContextType {
  campaigns: CampaignData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getScoreDetail: (semester_no: string, academic_year: string) => Promise<{
    criteria: Criteria[];
    sumscore: number;
  } | null>;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      // Lấy campaigns trực tiếp từ API (giống DataContext)
      const response = await api.get('/api/campaigns');
      console.log('Campaigns API response:', response.data);
      
      if (response.data.status === "success" && response.data.data) {
        const campaignData = response.data.data.campaigns || response.data.data || [];
        console.log('Campaign data:', campaignData);
        
        // Chuyển đổi thành format phù hợp
        const formattedCampaigns: CampaignData[] = campaignData.map((campaign: CampaignResponse) => ({
          id: campaign.id,
          name: campaign.name,
          semester_no: campaign.semester_no,
          academic_year: campaign.academic_year,
          criteria_id: campaign.criteria_id,
          max_score: campaign.max_score
        }));

        console.log('Formatted campaigns:', formattedCampaigns);
        setCampaigns(formattedCampaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Không thể tải dữ liệu campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreDetail = async (semester_no: string, academic_year: string) => {
    try {
      const response = await api.get(`/api/students/me/score-detail?semester_no=${semester_no}&academic_year=${academic_year}`);
      console.log('Raw API response:', response.data);
      
      if (response.data.status === "success" && response.data.data) {
        // Chuyển đổi dữ liệu từ backend format sang frontend format
        const backendCriteria: BackendCriteria[] = response.data.data.criteria || [];
        console.log('Backend criteria:', backendCriteria);
        console.log('Sample subcriteria:', backendCriteria[0]?.subcriteria);
        
        const frontendCriteria: Criteria[] = backendCriteria.map((criteria: BackendCriteria) => ({
          id: criteria.id,
          name: criteria.name,
          max_score: criteria.max_score,
          total_score: criteria.total_score,
          campaigns: (criteria.subcriteria || []).map((subCriteria: BackendSubCriteria) => ({
            id: subCriteria.id,
            name: subCriteria.name,
            max_score: subCriteria.max_score,
            total_score: subCriteria.total_score,
            activities: (subCriteria.activities || []).map((activity: BackendActivity) => ({
              id: activity.activity_id,
              name: activity.name,
              point: activity.point,
              has_participated: activity.has_participated,
              awarded_score: activity.awarded_score,
              note: "", // Giá trị mặc định vì backend không trả về
              status: activity.status,
              quantity: activity.max_participants || 0 // Giá trị mặc định vì backend không trả về
            }))
          }))
        }));

        console.log('Frontend criteria:', frontendCriteria);
        console.log('Sample campaigns:', frontendCriteria[0]?.campaigns);
        console.log('Final score:', response.data.data.final_score);

        return {
          criteria: frontendCriteria,
          sumscore: response.data.data.final_score || 0
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching score detail:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const refreshData = async () => {
    await fetchCampaigns();
  };

  return (
    <StudentDataContext.Provider
      value={{
        campaigns,
        loading,
        error,
        refreshData,
        getScoreDetail
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
} 