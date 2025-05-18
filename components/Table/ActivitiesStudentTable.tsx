'use client';
import { StudentActivity } from "@/types/studentActivity";
import { Tooltip } from "antd";
import { toast } from "sonner";

interface Props {
  activities: StudentActivity[] | StudentActivity[][];
}

export default function StudentActivitiesTable({ activities }: Props) {
  const showFullContent = (content: string) => {
    toast(content);
  };

  // Flatten the activities array if it's nested
  const flattenedActivities = Array.isArray(activities[0]) ? 
    (activities as StudentActivity[][]).flat() : 
    (activities as StudentActivity[]);

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {flattenedActivities.map((activity, index) => {
            const activityName = activity.Activity?.name || 
              (activity.activity_id && `Hoạt động ${activity.activity_id}`) || 
              "Không có tên";
            const campaignName = activity.Activity?.Campaign?.name || "Không có phong trào";
            const activityStatus = activity.Activity?.status || "expired";
            const semesterNo = activity.Activity?.Campaign?.semester_no || "-";
            const academicYear = activity.Activity?.Campaign?.academic_year || "-";
            
            return (
              <tr key={`${activity.student_id}-${activity.activity_id}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4">
                  <Tooltip title={activityName} placement="topLeft">
                    <div
                      className="max-w-[200px] truncate cursor-pointer"
                      onClick={() => showFullContent(activityName)}
                    >
                      {activityName}
                    </div>
                  </Tooltip>
                </td>
                <td className="px-6 py-4">
                  <Tooltip title={campaignName} placement="topLeft">
                    <div
                      className="max-w-[200px] truncate cursor-pointer"
                      onClick={() => showFullContent(campaignName)}
                    >
                      {campaignName}
                    </div>
                  </Tooltip>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={activity.awarded_score < 0 ? "text-red-600" : "text-green-600"}>
                    {activity.awarded_score}
                    <span className="ml-2 text-xs">
                      {activity.awarded_score < 0 ? '(Trừ điểm)' : '(Cộng điểm)'}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${activityStatus === 'ongoing' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'}`}>
                    {activityStatus === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">Học Kỳ {semesterNo} - {academicYear}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
