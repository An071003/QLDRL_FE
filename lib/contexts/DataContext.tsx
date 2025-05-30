'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Faculty {
  id: number;
  faculty_abbr: string;
  name: string;
  class_count?: number;
}

interface Class {
  id: number;
  name: string;
  faculty_id: number;
  cohort: string;
  student_count?: number;
}

interface Criteria {
  id: number;
  name: string;
  max_score: number;
  created_by?: number;
}

interface Campaign {
  id: number;
  name: string;
  criteria_id: number;
  semester_no?: number;
  academic_year?: number;
  max_score: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  activity_count?: number;
}

interface SemesterOption {
  value: string;
  label: string;
  semester_no: number;
  academic_year: number;
}

interface DataContextType {
  faculties: Faculty[];
  classes: Class[];
  criteria: Criteria[];
  campaigns: Campaign[];
  semesterOptions: SemesterOption[];
  currentSemester: string;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  setCurrentSemester: (semester: string) => void;
  getFilteredClasses: (facultyId: number | null) => Class[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([]);
  const [currentSemester, setCurrentSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns by current semester
  const fetchCampaignsBySemester = async (semester: string) => {
    if (!semester) return;
    
    try {
      const [semester_no, academic_year] = semester.split('_');
      const res = await api.get(`/api/campaigns/semester/${semester_no}/${academic_year}`);
      const campaignsData = res.data.data.campaigns || [];
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns by semester:', error);
      // Fallback to empty array instead of showing error toast to avoid spam
      setCampaigns([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [facultiesRes, classesRes, criteriaRes, semestersRes] = await Promise.all([
        api.get('/api/faculties'),
        api.get('/api/classes'),
        api.get('/api/criteria'),
        api.get('/api/campaigns/semesters')
      ]);
      
      setFaculties(facultiesRes.data.data.faculties);
      setClasses(classesRes.data.data.classes);
      setCriteria(criteriaRes.data.data.criteria);
      
      // Set semester options and default to latest semester
      const semesters = semestersRes.data.data.semesters || [];
      setSemesterOptions(semesters);
      if (semesters.length > 0 && !currentSemester) {
        const latestSemester = semesters[0].value;
        setCurrentSemester(latestSemester);
        // Fetch campaigns for the latest semester
        await fetchCampaignsBySemester(latestSemester);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu');
      toast.error('Không thể tải dữ liệu khoa và lớp');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle semester change
  const handleSetCurrentSemester = async (semester: string) => {
    setCurrentSemester(semester);
    if (semester) {
      await fetchCampaignsBySemester(semester);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = async () => {
    await fetchData();
  };

  const refreshCampaigns = async () => {
    if (currentSemester) {
      await fetchCampaignsBySemester(currentSemester);
    }
  };

  const getFilteredClasses = (facultyId: number | null) => {
    if (!facultyId) return [];
    return classes.filter(c => c.faculty_id === facultyId);
  };

  return (
    <DataContext.Provider
      value={{
        faculties,
        classes,
        criteria,
        campaigns,
        semesterOptions,
        currentSemester,
        loading,
        error,
        refreshData,
        refreshCampaigns,
        setCurrentSemester: handleSetCurrentSemester,
        getFilteredClasses
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 