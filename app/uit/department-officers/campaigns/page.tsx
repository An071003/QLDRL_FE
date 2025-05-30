'use client';

import { useState, useEffect } from "react";
import Loading from "@/components/Loading";
import { useRouter } from 'next/navigation';
import { Tooltip } from "antd";
import { useData } from "@/lib/contexts/DataContext";

export default function DPOCampaignManagement() {
  const router = useRouter();
  const { 
    campaigns, 
    criteria, 
    semesterOptions, 
    currentSemester, 
    setCurrentSemester, 
    loading 
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Initialize selectedSemester from context
  useEffect(() => {
    if (currentSemester && !selectedSemester) {
      setSelectedSemester(currentSemester);
    }
  }, [currentSemester, selectedSemester]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle semester change
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setCurrentSemester(semester);
    setCurrentPage(1);
  };

  const sortedAndFilteredCampaigns = campaigns
    .filter((campaign) => {
      const criteriaName = criteria.find(c => c.id === campaign.criteria_id)?.name || '';
      return campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        criteriaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${campaign.semester_no} ${campaign.academic_year}`.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Apply sorting
  if (sortField) {
    sortedAndFilteredCampaigns.sort((a, b) => {
              let valueA: string | number;
        let valueB: string | number;
      
      switch (sortField) {
        case 'id':
          valueA = a.id;
          valueB = b.id;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        case 'name':
          valueA = a.name || '';
          valueB = b.name || '';
          break;
        case 'criteria':
          valueA = criteria.find(c => c.id === a.criteria_id)?.name || '';
          valueB = criteria.find(c => c.id === b.criteria_id)?.name || '';
          break;
        case 'max_score':
          valueA = a.max_score || 0;
          valueB = b.max_score || 0;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        case 'semester':
          valueA = `${a.semester_no} ${a.academic_year}`;
          valueB = `${b.semester_no} ${b.academic_year}`;
          break;
        default:
          return 0;
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedAndFilteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = sortedAndFilteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý phong trào</h1>
      
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm theo tên phong trào, tiêu chí, học kỳ..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
        />
        <select
          value={selectedSemester}
          onChange={(e) => {
            handleSemesterChange(e.target.value);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-[200px] md:w-1/4"
          disabled={semesterOptions.length === 0}
        >
          {semesterOptions.length === 0 ? (
            <option value="">Đang tải học kỳ...</option>
          ) : (
            <>
              {!selectedSemester && (
                <option value="">-- Chọn học kỳ --</option>
              )}
              {semesterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  STT {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Tên phong trào {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('criteria')}
                >
                  Tiêu chí {sortField === 'criteria' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('semester')}
                >
                  Học kỳ {sortField === 'semester' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort('max_score')}
                >
                  Điểm tối đa {sortField === 'max_score' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                >
                  Số hoạt động
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCampaigns.map((campaign) => {
                const criteriaName = criteria.find(c => c.id === campaign.criteria_id)?.name || 'N/A';
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{campaign.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Tooltip title={campaign.name} placement="topLeft">
                        <div className="max-w-[200px] overflow-hidden text-ellipsis">
                          {campaign.name}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Tooltip title={criteriaName} placement="topLeft">
                        <div className="max-w-[200px] overflow-hidden text-ellipsis">
                          {criteriaName}
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      Học kỳ {campaign.semester_no} - {campaign.academic_year}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{campaign.max_score}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {campaign.activity_count || 0} hoạt động
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/uit/department-officers/campaigns/${campaign.id}`)}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Xem hoạt động
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, sortedAndFilteredCampaigns.length)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{sortedAndFilteredCampaigns.length}</span> phong trào
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &laquo;
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 