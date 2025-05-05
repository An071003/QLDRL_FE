"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import { ReceiptText, SquarePen, Trash } from "lucide-react";
import { Tooltip } from "antd";

interface ActivityTableProps {
  currentcampaigns: Campaign[];
  activities: Activity[];
  onDeleteActivity: (id: number) => void;
  onUpdateActivity: (id: number, updatedActivity: {
    name: string;
    point: number;
    campaign_id: number;
    negativescore?: number;
    status: "ongoing" | "expired";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPoint, setEditPoint] = useState(0);
  const [editCampaignId, setEditCampaignId] = useState<number | null>(null);
  const [editNegativeScore, setEditNegativeScore] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<"ongoing" | "expired">("ongoing");
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
    setEditNegativeScore(activity.is_negative ? activity.negativescore : 0);
    setEditStatus(activity.status);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditPoint(0);
    setEditCampaignId(null);
    setEditNegativeScore(0);
  };

  const handleSave = async (id: number) => {
    if (!editName.trim() || editPoint < 0 || editCampaignId === null) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ.");
      return;
    }
    if (editNegativeScore < 0) {
      toast.error("Điểm trừ phải lớn hơn hoặc bằng 0.");
      return;
    }

    if (editNegativeScore == null) {
      setEditNegativeScore(0);
    }

    const campaign = campaigns.find((c) => c.id === editCampaignId);

    if (!campaign) {
      toast.error("Không tìm thấy thông tin phong trào.");
      return;
    }

    if (editPoint > campaign.campaign_max_score) {
      toast.error(`Điểm không được lớn hơn điểm tối đa (${campaign.campaign_max_score}) của phong trào.`);
      return;
    }

    try {
      const updated = {
        name: editName,
        point: editPoint,
        campaign_id: editCampaignId,
        negativescore: editNegativeScore,
        status: editStatus,
      } as any;
      await onUpdateActivity(id, updated);

      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật hoạt động.");
    }
  };

  const handleReceiptClick = (id: number) => {
    router.push(`/uit/admin/activities/${id}`);
  };

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
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
                  activity.name
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
                  activity.campaign_name
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === activity.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-30"
                    value={editPoint}
                    min={0}
                    onChange={(e) => setEditPoint(Number(e.target.value))}
                  />
                ) : (
                  activity.point
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === activity.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-30"
                    value={editNegativeScore}
                    onChange={(e) => setEditNegativeScore(Number(e.target.value))}
                  />
                ) : activity.is_negative ? (
                  activity.negativescore
                ) : (
                  "Không"
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
