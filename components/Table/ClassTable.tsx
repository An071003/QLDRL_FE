"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import { Check, Edit, Trash2, X, ReceiptText } from "lucide-react";
import { Class } from "@/types/class";
import { Faculty } from "@/types/faculty";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props {
  classes: Class[];
  onEditClass: (classItem: Class) => void;
  onDeleteClass: (id: number) => void;
}

export default function ClassTable({
  classes,
  onEditClass,
  onDeleteClass,
}: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editFacultyId, setEditFacultyId] = useState<number>(0);
  const [editCohort, setEditCohort] = useState("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingId) {
      fetchFaculties();
    }
  }, [editingId]);

  const fetchFaculties = async () => {
    try {
      const response = await api.get('/api/faculties');
      setFaculties(response.data.data.faculties || []);
    } catch (err) {
      toast.error('Không thể tải danh sách khoa');
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingId(classItem.id);
    setEditName(classItem.name);
    setEditFacultyId(classItem.faculty_id);
    setEditCohort(classItem.cohort);
  };

  const handleViewDetail = (classId: number) => {
    router.push(`/uit/admin/classes/${classId}`);
  };

  const handleSave = async (id: number) => {
    setLoading(true);
    try {
      const updatedClass: Class = {
        id,
        name: editName,
        faculty_id: editFacultyId,
        cohort: editCohort,
      };
      await onEditClass(updatedClass);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditFacultyId(0);
    setEditCohort("");
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên lớp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khoa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {classes.map((classItem, index) => (
            <tr key={classItem.id}>
              <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === classItem.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                    disabled={loading}
                    autoFocus
                  />
                ) : (
                  classItem.name
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === classItem.id ? (
                  <select
                    value={editFacultyId}
                    onChange={(e) => setEditFacultyId(Number(e.target.value))}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                    disabled={loading}
                  >
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  classItem.Faculty?.name || "--"
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === classItem.id ? (
                  <input
                    type="text"
                    value={editCohort}
                    onChange={(e) => setEditCohort(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                    disabled={loading}
                  />
                ) : (
                  classItem.cohort
                )}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <div className="flex gap-2 justify-center">
                  {editingId === classItem.id ? (
                    <>
                      <Tooltip title="Lưu thay đổi">
                        <button
                          onClick={() => handleSave(classItem.id)}
                          className="text-green-600 hover:text-green-800"
                          disabled={loading}
                        >
                          <Check size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Hủy">
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-800"
                          disabled={loading}
                        >
                          <X size={20} />
                        </button>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Xem chi tiết">
                        <button
                          onClick={() => handleViewDetail(classItem.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <ReceiptText size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa lớp">
                        <button
                          onClick={() => handleEdit(classItem)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={20} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Xóa lớp">
                        <button
                          onClick={() => onDeleteClass(classItem.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={20} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {classes.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                Không có lớp nào trong hệ thống
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 