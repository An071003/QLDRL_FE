"use client";

interface ActivityTableProps {
  activities: any[];
  onSortPoint: () => void;
  sortOrder: "asc" | "desc";
}

export default function LecturerActivityTable({
  activities,
  onSortPoint,
  sortOrder,
}: ActivityTableProps) {

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hoạt động</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
            <th onClick={onSortPoint} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
              Điểm {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm trừ</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <tr key={activity.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>

              <td className="px-6 py-4 whitespace-nowrap">
                {activity.name}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {activity.campaign_name}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {activity.point}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {activity.is_negative ? (
                  activity.negativescore
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
