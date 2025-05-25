import React from 'react';
import { Activity } from '@/types/activity';
import { Campaign } from '@/types/campaign';
import { Tooltip } from 'antd';

interface ActivityTableProps {
  activities: Activity[];
  campaigns: Campaign[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onViewDetails: (id: number) => void;
  isPending?: boolean;
}

export default function ActivityTable({
  activities,
  campaigns,
  currentPage,
  itemsPerPage,
  totalItems,
  sortField,
  sortDirection,
  onSort,
  onPageChange,
  onViewDetails,
  isPending = false,
}: ActivityTableProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderSortIndicator = (field: string) => {
    return sortField === field && (sortDirection === 'asc' ? '▲' : '▼');
  };

  return (
    <div className="mt-4 bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                STT
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => onSort('name')}
              >
                Tên hoạt động {renderSortIndicator('name')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => onSort('campaign')}
              >
                Phong trào {renderSortIndicator('campaign')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => onSort('semester')}
              >
                Học kỳ {renderSortIndicator('semester')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => onSort('point')}
              >
                Điểm {renderSortIndicator('point')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer min-w-[120px]"
                onClick={() => onSort('number_students')}
              >
                SL đăng ký {renderSortIndicator('number_students')}
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer min-w-[120px]"
                onClick={() => onSort('max_participants')}
              >
                SL tối đa {renderSortIndicator('max_participants')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Thời gian đăng ký
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity, index) => {
              const campaign = campaigns.find(c => c.id === activity.campaign_id);
              return (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Tooltip title={activity.name} placement="topLeft">
                      <div className="max-w-[200px] overflow-hidden text-ellipsis">
                        {activity.name}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Tooltip title={campaign?.name || 'N/A'} placement="topLeft">
                      <div className="max-w-[200px] overflow-hidden text-ellipsis">
                        {campaign?.name || 'N/A'}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {campaign ? `Học kỳ ${campaign.semester_no} - ${campaign.academic_year}` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap min-w-[80px]">{activity.point}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center min-w-[120px]">
                    {activity.number_students || 0}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap min-w-[120px]">
                    {activity.max_participants || "Không giới hạn"}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {activity.registration_start && activity.registration_end 
                      ? `${new Date(activity.registration_start).toLocaleDateString('vi-VN')} - ${new Date(activity.registration_end).toLocaleDateString('vi-VN')}`
                      : "Không có thông tin"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold ${
                      isPending 
                        ? 'bg-yellow-100 text-yellow-800'
                        : activity.status === 'ongoing'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isPending 
                        ? 'Chờ phê duyệt'
                        : activity.status === 'ongoing'
                          ? 'Đang diễn ra'
                          : 'Đã kết thúc'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails(activity.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
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
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                trong tổng số <span className="font-medium">{totalItems}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Đầu
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageToShow = totalPages <= 5
                    ? i + 1
                    : Math.min(Math.max(currentPage - 2 + i, 1), totalPages);
                  return (
                    <button
                      key={pageToShow}
                      onClick={() => goToPage(pageToShow)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        currentPage === pageToShow
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageToShow}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  &gt;
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Cuối
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 