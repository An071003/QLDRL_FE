"use client";

import { useState } from "react";
import { StudentActivity } from "@/types/studentActivity";
import { SquarePen, Trash } from "lucide-react";
import { Tooltip } from "antd";
import { toast } from "sonner";

interface Props {
  students: StudentActivity[];
  onRemoveStudent: (studentId: number) => void;
  onToggleParticipated: (studentId: number, current: boolean) => void;
}

export default function StudentActivitiesTable({
  students,
  onRemoveStudent,
  onToggleParticipated,
}: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editParticipated, setEditParticipated] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const filtered = students.filter((s) =>
    `${s.student_id} ${s.student_name} ${s.class}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (s: StudentActivity) => {
    setEditingId(s.student_id);
    setEditParticipated(s.participated);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditParticipated(false);
  };

  const handleSave = async (studentId: number, participated: boolean) => {
    if (editParticipated === participated) {
        handleCancel();
        return;
    }
    try {
      setLoading(true);
      await onToggleParticipated(studentId, editParticipated);
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Danh sách sinh viên đã tham gia</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm kiếm sinh viên..."
        className="mb-4 px-3 py-2 border border-gray-300 rounded w-full md:w-1/2"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, index) => (
              <tr key={s.student_id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.student_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.student_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.class}</td>
                <td className="px-6 py-4 text-center w-48 whitespace-nowrap">
                  {editingId === s.student_id ? (
                    <select
                      value={editParticipated ? "true" : "false"}
                      onChange={(e) => setEditParticipated(e.target.value === "true")}
                      className="border rounded px-2 py-1"
                    >
                      <option value="true">Đã tham gia</option>
                      <option value="false">Chưa tham gia</option>
                    </select>
                  ) : s.participated ? (
                    "Đã tham gia"
                  ) : (
                    "Chưa tham gia"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  {editingId === s.student_id ? (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleSave(s.student_id, s.participated)}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={loading}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <Tooltip title="Chỉnh sửa trạng thái">
                        <button
                          onClick={() => handleEdit(s)}
                          className="cursor-pointer text-blue-600 hover:text-blue-900"
                          disabled={editingId !== null}
                        >
                          <SquarePen size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Xóa sinh viên" placement="top">
                        <button
                          onClick={() => onRemoveStudent(s.student_id)}
                          className="cursor-pointer text-red-600 hover:underline"
                          disabled={editingId !== null}
                        >
                          <Trash size={20} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Không có sinh viên nào phù hợp với tìm kiếm của bạn
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
