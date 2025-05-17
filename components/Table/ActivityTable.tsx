"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import { ReceiptText, SquarePen, Trash } from "lucide-react";
import { Tooltip } from "antd";
import Loading from "../Loading";

interface ActivityTableProps {
  currentcampaigns: Campaign[];
  activities: Activity[];
  onDeleteActivity: (id: number) => void;
  onUpdateActivity: (id: number, updatedActivity: {
    name: string;
    point: number;
    campaign_id: number;
    status: "ongoing" | "expired";
    max_participants?: number;
    registration_start?: string;
    registration_end?: string;
  }) => void;
  onSortPoint: () => void;
  sortOrder: "asc" | "desc";
}

export default function ActivityTable({
  currentcampaigns,
  activities,
  onDeleteActivity,
  onUpdateActivity,
  onSortPoint,
  sortOrder,
}: ActivityTableProps) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPoint, setEditPoint] = useState(0);
  const [editCampaignId, setEditCampaignId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<"ongoing" | "expired">("ongoing");
  const [editMaxParticipants, setEditMaxParticipants] = useState<number | undefined>(undefined);
  const [editRegistrationStart, setEditRegistrationStart] = useState("");
  const [editRegistrationEnd, setEditRegistrationEnd] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const router = useRouter();

  useEffect(() => {
    setCampaigns(currentcampaigns);
  }, [currentcampaigns]);

  const handleEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditName(activity.name);
    setEditPoint(activity.point);
    setEditCampaignId(activity.campaign_id);
    setEditStatus(activity.status);
    setEditMaxParticipants(activity.max_participants);
    setEditRegistrationStart(activity.registration_start || "");
    setEditRegistrationEnd(activity.registration_end || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditPoint(0);
    setEditCampaignId(null);
    setEditMaxParticipants(undefined);
    setEditRegistrationStart("");
    setEditRegistrationEnd("");
  };

  const handleSave = async (id: number) => {
    if (!editName.trim() || editCampaignId === null) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ.");
      return;
    }

    if (!editRegistrationStart || !editRegistrationEnd) {
      toast.error("Ngày bắt đầu và kết thúc đăng ký là bắt buộc.");
      return;
    }

    const campaign = campaigns.find((c) => c.id === editCampaignId);
    console.log("camoaun", campaign);
    if (!campaign) {
      handleCancel();
      return;
    }

    // For positive points, check against max campaign score
    if (editPoint > 0 && editPoint > (campaign?.max_score || 0)) {
      toast.error(`Điểm không được lớn hơn điểm tối đa (${campaign?.max_score || 0}) của phong trào.`);
      return;
    }

    try {
      const updated = {
        name: editName,
        point: editPoint,
        campaign_id: editCampaignId,
        status: editStatus,
        max_participants: editMaxParticipants || 0,
        registration_start: editRegistrationStart,
        registration_end: editRegistrationEnd
      } as {
        name: string;
        point: number;
        campaign_id: number;
        status: "ongoing" | "expired";
        max_participants: number;
        registration_start: string;
        registration_end: string;
      };
      setLoading(true);
      await onUpdateActivity(id, updated);

      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật hoạt động.");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptClick = (id: number) => {
    setLoading(true);
    router.push(`/uit/admin/activities/${id}`);
    setLoading(false);
  };

  if (loading) {
    return(
      <Loading />
    )
  }

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">SL đăng ký</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">SL tối đa</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian đăng ký</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <tr key={activity.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === activity.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <Tooltip title={activity.name} placement="topLeft">
                    <div className="max-w-[200px] overflow-hidden text-ellipsis">
                      {activity.name}
                    </div>
                  </Tooltip>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === activity.id ? (
                  <select
                    value={editCampaignId ?? ""}
                    onChange={(e) => setEditCampaignId(Number(e.target.value))}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="">-- Chọn phong trào --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Tooltip 
                    title={campaigns.find(campaign => campaign.id === activity.campaign_id)?.name || 
                    activity.campaign_name || 
                    "Không xác định"} 
                    placement="topLeft"
                  >
                    <div className="max-w-[200px] overflow-hidden text-ellipsis">
                      {campaigns.find(campaign => campaign.id === activity.campaign_id)?.name || 
                      activity.campaign_name || 
                      "Không xác định"}
                    </div>
                  </Tooltip>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === activity.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-30"
                    value={editPoint}
                    min={-100}
                    max={100}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || value === "-") {
                        setEditPoint(value === "-" ? -0 : 0);
                      } else {
                        setEditPoint(Number(value));
                      }
                    }}
                  />
                ) : (
                  <span className={activity.point < 0 ? "text-red-600" : "text-green-600"}>
                    {activity.point}
                    <span className="ml-2 text-xs">
                      {activity.point < 0 ? '(Trừ điểm)' : '(Cộng điểm)'}
                    </span>
                  </span>
                )}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === activity.id ? (
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "ongoing" | "expired")}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="expired">Đã kết thúc</option>
                  </select>
                ) : activity.status === "ongoing" ? (
                  "Đang diễn ra"
                ) : (
                  "Đã kết thúc"
                )}
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {activity.number_students}
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {editingId === activity.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-30"
                    value={editMaxParticipants}
                    onChange={(e) => setEditMaxParticipants(Number(e.target.value))}
                  />
                ) : activity.max_participants || "Không giới hạn"}
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {editingId === activity.id ? (
                  <div className="flex flex-col space-y-2">
                    <input
                      type="date"
                      className="border px-2 py-1 rounded w-full"
                      value={editRegistrationStart}
                      onChange={(e) => setEditRegistrationStart(e.target.value)}
                    />
                    <input
                      type="date"
                      className="border px-2 py-1 rounded w-full"
                      value={editRegistrationEnd}
                      onChange={(e) => setEditRegistrationEnd(e.target.value)}
                    />
                  </div>
                ) : (
                  activity.registration_start && activity.registration_end 
                     ? `${new Date(activity.registration_start).toLocaleDateString('vi-VN')} - ${new Date(activity.registration_end).toLocaleDateString('vi-VN')}`
                    : "Không có thông tin"
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                {editingId === activity.id ? (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSave(activity.id)} className="cursor-pointer text-green-600 hover:text-green-900">
                      Lưu
                    </button>
                    <button onClick={handleCancel} className="cursor-pointer text-gray-600 hover:text-gray-900">
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Tooltip title="Danh sách sinh viên tham gia" placement="top">
                      <button onClick={() => handleReceiptClick(activity.id)} className="cursor-pointer text-green-600 hover:text-green-900">
                        <ReceiptText size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa hoạt động" placement="top">
                      <button onClick={() => handleEdit(activity)} className="cursor-pointer text-blue-600 hover:text-blue-900">
                        <SquarePen size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Xóa hoạt động" placement="top">
                      <button onClick={() => onDeleteActivity(activity.id)} className="cursor-pointer text-red-600 hover:text-red-900">
                        <Trash size={20} />
                      </button>
                    </Tooltip>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

