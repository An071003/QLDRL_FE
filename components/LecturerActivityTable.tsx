'use client';

interface Activity {
  id: number;
  name: string;
  point: number;
  is_negative: boolean;
  campaign_name: string;
}

interface LecturerActivityTableProps {
  activities: Activity[];
}

export default function LecturerActivityTable({ activities }: LecturerActivityTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Hoạt động</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phong trào</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <tr key={activity.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.campaign_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.point}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {activity.is_negative ? "Điểm trừ" : "Điểm cộng"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
