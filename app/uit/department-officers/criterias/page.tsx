'use client';

import { useState, useMemo } from 'react';
import Loading from '@/components/Loading';
import { useData } from '@/lib/contexts/DataContext';

export default function CriteriaManagement() {
  const { criteria: contextCriteria, loading: dataLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredCriterias = useMemo(() => {
    if (!contextCriteria) return [];
    
    let filtered = [...contextCriteria];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((criteria) =>
        criteria.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by name
    filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.max_score - b.max_score;
      } else {
        return b.max_score - a.max_score;
      }
    });

    return filtered;
  }, [contextCriteria, searchTerm, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortMaxScore = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (dataLoading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý tiêu chí</h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm theo tên tiêu chí..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên Tiêu chí
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={handleSortMaxScore}
              >
                Điểm Tối Đa {sortOrder === "asc" ? "▲" : "▼"}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số phong trào
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCriterias.map((criteria, index) => (
              <tr key={criteria.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="px-6 py-4">
                  {criteria.name}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  {criteria.max_score}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {criteria.campaign_count || 0} phong trào
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 