"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import api from "@/lib/api";

interface ActivityTableProps {
  activities: Activity[];
  onDeleteActivity: (id: number) => void;
  onUpdateActivity: (id: number, updatedActivity: {
    name: string;
    point: number;
    campaign_id: number;
    negativescore?: number;
  }) => void;
  onSortPoint: () => void;
  sortOrder: "asc" | "desc";
}

export default function ActivityTable({
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
    setEditNegativeScore(activity.is_negative ? activity.negativescore : 0);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditPoint(0);
    setEditCampaignId(null);
    setEditNegativeScore(0); 
  };

  const handleSave = async (id: number) => {
    console.log("Updated activity:", {
      name: editName,
      point: editPoint,
      campaign_id: editCampaignId,
      negativescore: editNegativeScore,
    }
    );
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
    if (editNegativeScore < 0) { 
      toast.error("Điểm trừ phải lớn hơn hoặc bằng 0.");
      return;
    }
    
    if (editNegativeScore == null) {
      setEditNegativeScore(0);
    }

    try {
      const updated = {
        name: editName,
        point: editPoint,
        campaign_id: editCampaignId,
      } as any;

      const current = activities.find((a) => a.id === id);
      if (current?.is_negative) {
        updated.negativescore = editNegativeScore;
      }
      
      await onUpdateActivity(id, updated);
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
            <th onClick={onSortPoint} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
              Điểm {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm trừ</th>
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
                {editingId === activity.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-full"
                    value={editNegativeScore}
                    onChange={(e) => setEditNegativeScore(Number(e.target.value))}
                    min={0}
                  />
                ) : activity.is_negative ? (
                  activity.negativescore
                ) : (
                  "Không"
                )}  
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === activity.id ? (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSave(activity.id)} className="text-green-600 hover:text-green-900">
                      Lưu
                    </button>
                    <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(activity)} className="text-blue-600 hover:text-blue-900">
                      Sửa
                    </button>
                    <button onClick={() => onDeleteActivity(activity.id)} className="text-red-600 hover:text-red-900">
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
