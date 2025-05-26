'use client';

import { useState, useMemo } from 'react';
import FacultyTable from '@/components/Table/DepartmentOfficerFacultyTable';
import Loading from '@/components/Loading';
import { useData } from '@/lib/contexts/DataContext';

export default function FacultyManagementPage() {
  const { faculties: contextFaculties, loading: dataLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaculties = useMemo(() => {
    if (!contextFaculties) return [];
    
    return contextFaculties.filter((faculty) =>
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.faculty_abbr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contextFaculties, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (dataLoading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý khoa</h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm khoa..."
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>

      <div className="mb-6">
        <FacultyTable 
          faculties={filteredFaculties || []} 
          onEditFaculty={() => {}}
          onDeleteFaculty={() => {}}
        />
      </div>
    </div>
  );
}
