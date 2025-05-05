"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Loading from "./Loading";


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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReceiptClick = (id: number) => {
    setLoading(true);
    router.push(`/uit/lecturer/activities/${id}`);
    setLoading(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hoạt động</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
            <th onClick={onSortPoint} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
              Điểm {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm trừ</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
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
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {activity.point}
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {activity.is_negative ? (
                  activity.negativescore
                ) : (
                  "Không"
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {activity.status === "ongoing" ? (
                  "Đang diễn ra"
                ) : (
                  "Đã kết thúc"
                )}
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {activity.number_students}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-md font-medium">
                <button onClick={() => handleReceiptClick(activity.id)} className="cursor-pointer text-green-600 hover:text-green-900">
                  chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
