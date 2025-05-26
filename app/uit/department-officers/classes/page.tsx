'use client';

import { useState, useMemo } from 'react';
import ClassTable from '@/components/Table/DepartmentOfficerClassTable';
import Loading from '@/components/Loading';
import { useData } from '@/lib/contexts/DataContext';

export default function ClassManagementPage() {
  const { classes: contextClasses, loading: dataLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = useMemo(() => {
    if (!contextClasses) return [];
    
    return contextClasses.filter((classItem) =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(classItem.cohort).includes(searchTerm)
    );
  }, [contextClasses, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (dataLoading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý lớp</h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm lớp..."
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>

      <div className="mb-6">
        <ClassTable 
          classes={filteredClasses || []} 
          onEditClass={() => {}}
          onDeleteClass={() => {}}
        />
      </div>
    </div>
  );
} 