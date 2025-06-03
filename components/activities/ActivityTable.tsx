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
  showFilters?: boolean;
  selectedCampaign?: string;
  startDate?: string;
  endDate?: string;
  onCampaignChange?: (campaign: string) => void;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onClearFilters?: () => void;
}

export default function ActivityTable({
  activities,
  campaigns,
  sortField,
  sortDirection,
  onSort,
  onViewDetails,
  isPending = false,
  showFilters = false,
  selectedCampaign = "",
  startDate = "",
  endDate = "",
  onCampaignChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
}: ActivityTableProps) {
  const renderSortIndicator = (field: string) => {
    return sortField === field && (sortDirection === 'asc' ? '▲' : '▼');
  };

  return (
    <div className="mt-4 bg-white rounded-lg shadow overflow-hidden mb-6">
      {showFilters && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <select
              value={selectedCampaign}
              onChange={(e) => onCampaignChange?.(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
            >
              <option value="">-- Tất cả phong trào --</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id.toString()}>
                  {campaign.name}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2 items-center w-full md:w-auto">
              <label className="text-sm text-gray-600 whitespace-nowrap">Từ ngày:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex gap-2 items-center w-full md:w-auto">
              <label className="text-sm text-gray-600 whitespace-nowrap">Đến ngày:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                STT
              </th>
              <th
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer w-[250px]"
                onClick={() => onSort('name')}
              >
                Tên hoạt động {renderSortIndicator('name')}
              </th>
              <th
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer w-[250px]"
                onClick={() => onSort('campaign')}
              >
                Phong trào {renderSortIndicator('campaign')}
              </th>
              <th
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => onSort('point')}
              >
                Điểm {renderSortIndicator('point')}
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Số lượng
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
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
                  <td className="px-2 py-3 whitespace-nowrap">
                    <Tooltip title={activity.name} placement="topLeft">
                      <div className="max-w-[250px] overflow-hidden text-ellipsis">
                        {activity.name}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <Tooltip title={campaign?.name || 'N/A'} placement="topLeft">
                      <div className="max-w-[250px] overflow-hidden text-ellipsis">
                        {campaign?.name || 'N/A'}
                      </div>
                    </Tooltip>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap min-w-[80px]">
                    <span className={activity.point < 0 ? "text-red-600" : "text-green-600"}>
                      {activity.point}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <span>
                      {activity.number_students || 0} / {activity.max_participants || 'Không giới hạn'}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div>
                      {activity.registration_start && activity.registration_end ? (
                        <>
                          <div>{new Date(activity.registration_start).toLocaleDateString('vi-VN')}</div>
                          <div>{new Date(activity.registration_end).toLocaleDateString('vi-VN')}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">Chưa có thông tin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
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
                  <td className="px-2 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails(activity.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                    >
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