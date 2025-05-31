'use client';

import { useState, useMemo } from 'react';
import ClassTable from '@/components/Table/DepartmentOfficerClassTable';
import Loading from '@/components/Loading';
import { useData } from '@/lib/contexts/DataContext';

export default function ClassManagementPage() {
  const { classes: contextClasses, loading: dataLoading, faculties } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');

  const filteredClasses = useMemo(() => {
    if (!contextClasses) return [];
    
    return contextClasses.filter((classItem) => {
      const matchesSearch = 
        classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(classItem.cohort).includes(searchTerm);
      
      const matchesFaculty = !selectedFacultyId || classItem.faculty_id?.toString() === selectedFacultyId;
      
      return matchesSearch && matchesFaculty;
    });
  }, [contextClasses, searchTerm, selectedFacultyId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (dataLoading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý lớp</h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <input
            type="text"
            placeholder="Tìm kiếm lớp..."
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/2"
          />
          <select
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded max-w-[200px] md:w-1/2"
          >
            <option value="">Tất cả khoa</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id.toString()}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>
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