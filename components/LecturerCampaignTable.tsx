'use client';

interface Campaign {
  id: number;
  name: string;
  max_score: number;
  semester_name: string;
  start_year: number;
  end_year: number;
}

interface LecturerCampaignTableProps {
  campaigns: Campaign[];
  sortOrder: "asc" | "desc";
  onSortMaxScore: () => void;
}

export default function LecturerCampaignTable({ campaigns, sortOrder, onSortMaxScore }: LecturerCampaignTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Phong trào</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={onSortMaxScore}
            >
              Điểm Tối Đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign, index) => (
            <tr key={campaign.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{campaign.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {`${campaign.semester_name} (${campaign.start_year}-${campaign.end_year})`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{campaign.max_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
