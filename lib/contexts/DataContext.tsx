'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Faculty {
  id: number;
  faculty_abbr: string;
  name: string;
}

interface Class {
  id: number;
  name: string;
  faculty_id: number;
  cohort: number;
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
}

interface Activity {
  id: number;
  name: string;
  point: number;
  campaign_id: number;
  approver_id: number | null;
  creator_id: number | null;
  max_participants?: number;
  number_students?: number;
  registration_start?: string;
  registration_end?: string;
  status?: string;
}

interface DataContextType {
  faculties: Faculty[];
  classes: Class[];
  criteria: Criteria[];
  campaigns: Campaign[];
  activities: Activity[];
  pendingActivities: Activity[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  getFilteredClasses: (facultyId: number | null) => Class[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [facultiesRes, classesRes, criteriaRes, campaignsRes] = await Promise.all([
        api.get('/api/faculties'),
        api.get('/api/classes'),
        api.get('/api/criteria'),
        api.get('/api/campaigns')
      ]);
      
      setFaculties(facultiesRes.data.data.faculties);
      setClasses(classesRes.data.data.classes);
      setCriteria(criteriaRes.data.data.criteria);
      setCampaigns(campaignsRes.data.data.campaigns || campaignsRes.data.data || []);
    } catch (err) {
      setError('Không thể tải dữ liệu');
      toast.error('Không thể tải dữ liệu khoa và lớp');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      // Get all activities
      const activitiesRes = await api.get("/api/activities");
      let allActivities;

      if (activitiesRes.data.data.activities) {
        allActivities = activitiesRes.data.data.activities;
      } else {
        allActivities = activitiesRes.data.data || [];
      }

      // Add campaign information to activities
      allActivities = allActivities.map((activity: Activity) => {
        const campaign = campaigns.find((c) => c.id === activity.campaign_id);
        return {
          ...activity,
          campaign_name: campaign ? campaign.name : "Không xác định",
          semester_no: campaign?.semester_no,
          academic_year: campaign?.academic_year
        };
      });

      const approved = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      const pending = allActivities.filter((activity: Activity) => activity.approver_id === null);
      
      setActivities(approved);
      setPendingActivities(pending);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) {
      fetchActivities();
    }
  }, [campaigns]);

  const refreshData = async () => {
    await fetchData();
  };

  const refreshActivities = async () => {
    await fetchActivities();
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
        activities,
        pendingActivities,
        loading,
        error,
        refreshData,
        refreshActivities,
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