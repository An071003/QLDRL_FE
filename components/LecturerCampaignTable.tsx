"use client";

import { Campaign } from "@/types/campaign";

interface CampaignTableProps {
  campaigns: any[];
  onSortMaxScore: () => void;
  sortOrder: "asc" | "desc";
}

export default function LecturerCampaignTable({ campaigns, onSortMaxScore, sortOrder }: CampaignTableProps) {
  console.log(campaigns);
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
                {`${campaign.semester_name} (${campaign.start_year}-${campaign.end_year})`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {campaign.campaign_max_score}
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
