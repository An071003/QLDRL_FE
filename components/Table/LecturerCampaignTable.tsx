"use client";

import { Campaign } from "@/types/campaign";

interface CampaignTableProps {
  campaigns: Campaign[];
  onSortMaxScore: () => void;
  sortOrder: "asc" | "desc";
}

export default function LecturerCampaignTable({ campaigns, onSortMaxScore, sortOrder }: CampaignTableProps) {
  // Hàm để hiển thị tên học kỳ dựa trên semester_no và academic_year
  const getSemesterDisplay = (campaign: Campaign) => {
    if (campaign.semester_no && campaign.academic_year) {
      return campaign.semester_no === 3 
        ? `Học kỳ Hè (${campaign.academic_year})` 
        : `Học kỳ ${campaign.semester_no} (${campaign.academic_year})`;
    } 
    
    // Hỗ trợ tương thích với dữ liệu cũ
    if (campaign.semester_name && campaign.start_year && campaign.end_year) {
      return `${campaign.semester_name} (${campaign.start_year}-${campaign.end_year})`;
    }
    
    return "Không xác định";
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu chí</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
            <th
              onClick={onSortMaxScore}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            >
              Điểm tối đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm trừ</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign, index) => (
            <tr key={campaign.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {campaign.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {campaign.criteria_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getSemesterDisplay(campaign)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {campaign.campaign_max_score || campaign.max_score}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {campaign.is_negative ? (
                  campaign.negativescore
                ) : (
                  "Không"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
