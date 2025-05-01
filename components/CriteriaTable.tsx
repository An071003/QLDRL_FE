"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Criteria } from "@/types/criteria";

interface CriteriaTableProps {
  criterias: Criteria[];
  onDeleteCriteria: (id: number) => void;
  onUpdateCriteria: (id: number, updatedCriteria: { name: string; max_score: number }) => void;
  onSortMaxScore: () => void;
  sortOrder: "asc" | "desc";
}

export default function CriteriaTable({ criterias, onDeleteCriteria, onUpdateCriteria, onSortMaxScore, sortOrder }: CriteriaTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMaxScore, setEditMaxScore] = useState(0);

  const handleEdit = (criteria: Criteria) => {
    setEditingId(criteria.id);
    setEditName(criteria.name);
    setEditMaxScore(criteria.max_score);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditMaxScore(0);
  };

  const handleSave = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Tên tiêu chí không được để trống.");
      return;
    }
    if (editMaxScore < 0) {
      toast.error("Điểm tối đa phải lớn hơn hoặc bằng 0.");
      return;
    }
    try {
      await onUpdateCriteria(id, { name: editName, max_score: editMaxScore });
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật tiêu chí.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Tiêu Chí</th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={onSortMaxScore}
            >
              Điểm Tối Đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành Động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {criterias.map((criteria, index) => (
            <tr key={criteria.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === criteria.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  criteria.name
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === criteria.id ? (
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-full"
                    value={editMaxScore}
                    min={0}
                    onChange={(e) => setEditMaxScore(Number(e.target.value))}
                  />
                ) : (
                  criteria.max_score
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === criteria.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleSave(criteria.id)}
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
                      onClick={() => handleEdit(criteria)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDeleteCriteria(criteria.id)}
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
