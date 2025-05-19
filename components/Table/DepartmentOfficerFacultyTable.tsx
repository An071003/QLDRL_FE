"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import { Edit, ReceiptText, Trash } from "lucide-react";
import { Faculty } from "@/types/faculty";

interface Props {
  faculties: Faculty[];
  onEditFaculty: (faculty: Faculty) => void;
  onDeleteFaculty: (id: number) => void;
}

export default function FacultyTable({
  faculties,
  onEditFaculty,
  onDeleteFaculty,
}: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAbbr, setEditAbbr] = useState("");
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEdit = (faculty: Faculty) => {
    setEditingId(faculty.id);
    setEditAbbr(faculty.faculty_abbr);
    setEditName(faculty.name);
  };

  const handleViewDetail = (facultyId: number) => {
    router.push(`/uit/department-officers/faculties/${facultyId}`);
  };

  const handleSave = async (id: number) => {
    setLoading(true);
    try {
      const updatedFaculty: Faculty = {
        id,
        faculty_abbr: editAbbr,
        name: editName,
      };
      await onEditFaculty(updatedFaculty);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAbbr("");
    setEditName("");
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã khoa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên khoa</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {faculties.map((faculty, index) => (
            <tr key={faculty.id}>
              <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === faculty.id ? (
                  <input
                    type="text"
                    value={editAbbr}
                    onChange={(e) => setEditAbbr(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                    disabled={loading}
                    autoFocus
                  />
                ) : (
                  faculty.faculty_abbr
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === faculty.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                    disabled={loading}
                  />
                ) : (
                  faculty.name
                )}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <div className="flex gap-2 justify-center">
                  {editingId === faculty.id ? (
                    <>
                      <Tooltip title="Lưu thay đổi">
                        <button
                          onClick={() => handleSave(faculty.id)}
                          className="text-green-600 hover:text-green-800"
                          disabled={loading}
                        >
                          Lưu
                        </button>
                      </Tooltip>
                      <Tooltip title="Hủy">
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-800"
                          disabled={loading}
                        >
                          Hủy
                        </button>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Xem chi tiết">
                        <button
                          onClick={() => handleViewDetail(faculty.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <ReceiptText size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa khoa">
                        <button
                          onClick={() => handleEdit(faculty)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Xóa khoa">
                        <button
                          onClick={() => onDeleteFaculty(faculty.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash size={20} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {faculties.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                Không có khoa nào trong hệ thống
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 