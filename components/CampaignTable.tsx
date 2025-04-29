"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Campaign } from "@/types/campaign";

interface CampaignTableProps {
  campaigns: Campaign[];
  onDeleteCampaign: (id: number) => void;
  onUpdateCampaign: (id: number, updatedCampaign: { name: string; max_score: number; criteria_id: number; is_negative: boolean; negativescore: number }) => void;
  onSortMaxScore: () => void;
  sortOrder: "asc" | "desc";
}

export default function CampaignTable({ campaigns, onDeleteCampaign, onUpdateCampaign, onSortMaxScore, sortOrder }: CampaignTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(0);

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setEditName(campaign.name);
    setEditMaxScore(campaign.max_score);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditMaxScore(0);
  };

  const handleSave = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Tên chiến dịch không được để trống.");
      return;
    }
    if (editMaxScore < 0) {
      toast.error("Điểm tối đa phải lớn hơn hoặc bằng 0.");
      return;
    }
    try {
      await onUpdateCampaign(id, {
        name: editName,
        max_score: editMaxScore,
        criteria_id: 0, // Không cho sửa criteria_id tại đây
        is_negative: false, // Không cho sửa is_negative tại đây
        negativescore: 0,   // Không cho sửa negativescore tại đây
      });
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật chiến dịch.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
            <th
              onClick={onSortMaxScore}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            >
              Điểm tối đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign, index) => (
            <tr key={campaign.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === campaign.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  campaign.name
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {`${campaign.semester_name} (${campaign.start_year}-${campaign.end_year})`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === campaign.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-full"
                    value={editMaxScore}
                    min={0}
                    onChange={(e) => setEditMaxScore(Number(e.target.value))}
                  />
                ) : (
                  campaign.max_score
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === campaign.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleSave(campaign.id)}
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
                      onClick={() => handleEdit(campaign)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDeleteCampaign(campaign.id)}
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
