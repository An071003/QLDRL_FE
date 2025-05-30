"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Campaign } from "@/types/campaign";
import { Criteria } from "@/types/criteria";
import { SquarePen, Trash } from "lucide-react";
import { Tooltip } from "antd";

interface CampaignTableProps {
  campaigns: Campaign[];
  criterias: Criteria[];
  onDeleteCampaign: (id: number) => void;
  onUpdateCampaign: (id: number, updatedCampaign: { name: string; max_score: number; criteria_id: number; semester_no: number; academic_year: number }) => void;
  onSortMaxScore: () => void;
  sortOrder: "asc" | "desc";
}

export default function CampaignTable({ campaigns, criterias, onDeleteCampaign, onUpdateCampaign, onSortMaxScore, sortOrder }: CampaignTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(0);
  const [editedCriteriaId, setEditedCriteriaId] = useState<number | null>(null);
  const [editSemesterNo, setEditSemesterNo] = useState(1);
  const [editAcademicYear, setEditAcademicYear] = useState(new Date().getFullYear());

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setEditName(campaign.name);
    setEditMaxScore(campaign.max_score);
    setEditedCriteriaId(campaign.criteria_id);
    setEditSemesterNo(campaign.semester_no || 1);
    setEditAcademicYear(campaign.academic_year || new Date().getFullYear());
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditMaxScore(0);
    setEditedCriteriaId(null);
    setEditSemesterNo(1);
    setEditAcademicYear(new Date().getFullYear());
  };

  const handleSave = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Tên phong trào không được để trống.");
      return;
    }
    if (editMaxScore < 0) {
      toast.error("Điểm tối đa phải lớn hơn hoặc bằng 0.");
      return;
    }

    if (editedCriteriaId === null) {
      toast.error("Vui lòng chọn tiêu chí.");
      return;
    }

    const selectedCriteria = criterias.find(c => c.id === editedCriteriaId);
    if (!selectedCriteria) {
      toast.error("Tiêu chí không hợp lệ.");
      return;
    }

    if (editMaxScore > selectedCriteria.max_score) {
      toast.error(`Điểm phong trào không được lớn hơn điểm tiêu chí (${selectedCriteria.max_score}).`);
      return;
    }

    try {
      await onUpdateCampaign(id, {
        name: editName,
        max_score: editMaxScore,
        criteria_id: editedCriteriaId,
        semester_no: editSemesterNo,
        academic_year: editAcademicYear
      });
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật phong trào.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu chí</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
            <th
              onClick={onSortMaxScore}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            >
              Điểm tối đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số hoạt động</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign, index) => (
            <tr key={campaign.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 max-w-[12rem] truncate whitespace-nowrap overflow-hidden">
                {editingId === campaign.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <Tooltip title={campaign.name}>
                    <span>{campaign.name}</span>
                  </Tooltip>
                )}
              </td>
              <td className="px-6 py-4 max-w-[14rem] truncate whitespace-nowrap overflow-hidden">
                {editingId === campaign.id ? (
                  <select
                    value={editedCriteriaId ?? ""}
                    onChange={(e) => setEditedCriteriaId(Number(e.target.value))}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="">-- Chọn tiêu chí --</option>
                    {criterias.map((criteria) => (
                      <option key={criteria.id} value={criteria.id}>
                        {criteria.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Tooltip title={criterias.find(c => c.id === campaign.criteria_id)?.name || `Tiêu chí ID: ${campaign.criteria_id}`}>
                    <span>{criterias.find(c => c.id === campaign.criteria_id)?.name || `Tiêu chí ID: ${campaign.criteria_id}`}</span>
                  </Tooltip>
                )}
              </td>
              <td className="px-6 py-4 max-w-[10rem] truncate whitespace-nowrap overflow-hidden">
                {editingId === campaign.id ? (
                  <div className="flex gap-2">
                    <select
                      value={editSemesterNo}
                      onChange={(e) => setEditSemesterNo(Number(e.target.value))}
                      className="border px-2 py-1 rounded"
                    >
                      <option value={1}>Học kỳ 1</option>
                      <option value={2}>Học kỳ 2</option>
                    </select>
                    <input
                      type="number"
                      className="border px-2 py-1 rounded w-20"
                      value={editAcademicYear}
                      onChange={(e) => setEditAcademicYear(Number(e.target.value))}
                      min={2000}
                      max={2100}
                    />
                  </div>
                ) : (
                  `Học kỳ ${campaign.semester_no} (${campaign.academic_year})`
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === campaign.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-30"
                    value={editMaxScore}
                    min={0}
                    onChange={(e) => setEditMaxScore(Number(e.target.value))}
                  />
                ) : (
                  campaign.max_score
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {campaign.activity_count || 0} hoạt động
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === campaign.id ? (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleSave(campaign.id)}
                      className="cursor-pointer text-green-600 hover:text-green-900"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      className="cursor-pointer text-gray-600 hover:text-gray-900"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center gap-2">
                    <Tooltip title="Chỉnh sửa phong trào">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="cursor-pointer text-blue-600 hover:text-blue-900"
                      >
                        <SquarePen size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Xóa phong trào">
                      <button
                        onClick={() => onDeleteCampaign(campaign.id)}
                        className="cursor-pointer text-red-600 hover:text-red-900"
                      >
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
