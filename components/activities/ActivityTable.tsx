import React from 'react';
import { Activity } from '@/types/activity';
import { Campaign } from '@/types/campaign';
import { Tooltip } from 'antd';

interface ActivityTableProps {
  activities: Activity[];
  campaigns: Campaign[];
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onViewDetails: (id: number) => void;
  isPending?: boolean;
}

export default function ActivityTable({
  activities,
  campaigns,
  sortField,
  sortDirection,
  onSort,
  onViewDetails,
  isPending = false,
}: ActivityTableProps) {
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
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Tooltip title={activity.name} placement="topLeft">
                      <div className="max-w-[250px] overflow-hidden text-ellipsis">
                        {activity.name}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Tooltip title={campaign?.name || 'N/A'} placement="topLeft">
                      <div className="max-w-[250px] overflow-hidden text-ellipsis">
                        {campaign?.name || 'N/A'}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {campaign ? `Học kỳ ${campaign.semester_no} - ${campaign.academic_year}` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap min-w-[80px]">
                    <span className={activity.point < 0 ? "text-red-600" : "text-green-600"}>
                      {activity.point}
                      <span className="ml-2 text-xs">
                        {activity.point < 0 ? '(Trừ điểm)' : '(Cộng điểm)'}
                      </span>
                    </span>
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
    </div>
  );
} 