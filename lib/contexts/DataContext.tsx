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

interface DataContextType {
  faculties: Faculty[];
  classes: Class[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getFilteredClasses: (facultyId: number | null) => Class[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [facultiesRes, classesRes] = await Promise.all([
        api.get('/api/faculties'),
        api.get('/api/classes')
      ]);
      setFaculties(facultiesRes.data.data.faculties);
      setClasses(classesRes.data.data.classes);
    } catch (err) {
      setError('Không thể tải dữ liệu');
      toast.error('Không thể tải dữ liệu khoa và lớp');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = async () => {
    await fetchData();
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
        loading,
        error,
        refreshData,
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