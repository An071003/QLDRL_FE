"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Activity } from "@/types/activity";
import api from "@/lib/api";

interface Campaign {
  id: number;
  name: string;
}

interface ActivityTableProps {
  activities: Activity[];
  onDeleteActivity: (id: number) => void;
  onUpdateActivity: (id: number, updatedActivity: { name: string; point: number; campaign_id: number }) => void;
  onSortPoint: () => void;
  sortOrder: "asc" | "desc";
}

export default function ActivityTable({ activities, onDeleteActivity, onUpdateActivity, onSortPoint, sortOrder }: ActivityTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPoint, setEditPoint] = useState(0);
  const [editCampaignId, setEditCampaignId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.get("/api/campaigns");
        setCampaigns(res.data.data.campaigns);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      }
    };
    fetchCampaigns();
  }, []);

  const handleEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditName(activity.name);
    setEditPoint(activity.point);
    setEditCampaignId(activity.campaign_id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditPoint(0);
    setEditCampaignId(null);
  };

  const handleSave = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Tên hoạt động không được để trống.");
      return;
    }
    if (editPoint < 0) {
      toast.error("Điểm phải lớn hơn hoặc bằng 0.");
      return;
    }
    if (!editCampaignId) {
      toast.error("Vui lòng chọn phong trào.");
      return;
    }
    try {
      await onUpdateActivity(id, {
        name: editName,
        point: editPoint,
        campaign_id: editCampaignId,
      });
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật hoạt động.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hoạt động</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
            <th
              onClick={onSortPoint}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            >
              Điểm {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
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
                    className="border px-2 py-1 rounded w-full"
                    value={editPoint}
                    min={0}
                    onChange={(e) => setEditPoint(Number(e.target.value))}
                  />
                ) : (
                  activity.point
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {activity.is_negative ? "Điểm trừ" : "Điểm cộng"}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === activity.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleSave(activity.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(activity)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDeleteActivity(activity.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
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
