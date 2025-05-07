'use client';
import { StudentActivity } from "@/types/studentActivity";

interface Props {
  activities: StudentActivity[];
}

export default function StudentActivitiesTable({ activities }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hoạt động</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phong trào</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm được cộng</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <tr key={activity.activity_id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.activity_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.campaign_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.point}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.awarded_score}</td>
              <td className="px-6 py-4 whitespace-nowrap">{activity.semester_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
