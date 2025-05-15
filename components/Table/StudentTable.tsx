"use client";

import { Tooltip } from "antd";
import { ReceiptText, Trash2, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Student } from "@/types/student";
import { toast } from "sonner";

interface Props {
  students: Student[];
  onDeleteStudent: (id: string) => void;
  onUpdateStudent: (id: string, updatedData: Partial<Student>) => void;
}

export default function StudentTable({
  students,
  onDeleteStudent,
  onUpdateStudent,
}: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<'none' | 'disciplined'>('none');

  const handleViewActivities = (id: string) => {
    router.push(`/uit/admin/students/${id}`);
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.student_id);
    setEditName(student.student_name || "");
    setEditPhone(student.phone || "");
    setEditStatus(student.status);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = (id: string) => {
    if (!editName.trim()) {
      toast.error("Vui lòng nhập tên sinh viên.");
      return;
    }

    if (editPhone && editPhone.trim().length !== 10) {
      toast.error("Số điện thoại phải có đúng 10 ký tự.");
      return;
    }

    onUpdateStudent(id, {
      student_name: editName,
      phone: editPhone,
      status: editStatus,
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MSSV</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng DRL</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student, index) => (
            <tr key={student.student_id}>
              <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.student_id}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.student_id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  student.student_name || "--"
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.student_id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Chỉ cho phép nhập số và tối đa 10 ký tự
                      if (/^\d{0,10}$/.test(value)) {
                        setEditPhone(value);
                      }
                    }}
                    placeholder="Nhập 10 số"
                    maxLength={10}
                  />
                ) : (
                  student.phone || "--"
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.student_id ? (
                  <select
                    className="border px-2 py-1 rounded w-full"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'none' | 'disciplined')}
                  >
                    <option value="none">Bình thường</option>
                    <option value="disciplined">Bị kỷ luật</option>
                  </select>
                ) : (
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${student.status === 'none'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'}`}
                  >
                    {student.status === 'none' ? 'Bình thường' : 'Bị kỷ luật'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{student.sumscore}</td>
              <td className="px-4 py-3 text-center whitespace-nowrap flex gap-2 justify-center">
                {editingId === student.student_id ? (
                  <>
                    <button
                      onClick={() => handleSave(student.student_id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <Tooltip title="Xem hoạt động đã tham gia">
                      <button
                        onClick={() => handleViewActivities(student.student_id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <ReceiptText size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa sinh viên">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <SquarePen size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Xóa sinh viên">
                      <button
                        onClick={() => onDeleteStudent(student.student_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={20} />
                      </button>
                    </Tooltip>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
