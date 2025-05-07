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
  onViewActivities: (id: string) => void;
}

export default function StudentTable({
  students,
  onDeleteStudent,
  onUpdateStudent,
  onViewActivities
}: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFaculty, setEditFaculty] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editStatus, setEditStatus] = useState<'none'| 'disciplined'>('none');

  const handleViewActivities = (id: string) => {
    router.push(`/uit/admin/students/${id}`);
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.student_name);
    setEditFaculty(student.faculty);
    setEditCourse(student.course);
    setEditClass(student.class);
    setEditStatus(student.status);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = (id: string) => {
    if (!editName.trim() || !editFaculty.trim() || !editCourse.trim() || !editClass.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    onUpdateStudent(id, {
      student_name: editName,
      faculty: editFaculty,
      course: editCourse,
      class: editClass,
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khoa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng DRL</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student, index) => (
            <tr key={student.id}>
              <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
              <td className="px-4 py-3 whitespace-nowrap">{student.id}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  student.student_name
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editFaculty}
                    onChange={(e) => setEditFaculty(e.target.value)}
                  />
                ) : (
                  student.faculty
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                  />
                ) : (
                  student.course
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === student.id ? (
                  <input
                    className="border px-2 py-1 rounded w-full"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                  />
                ) : (
                  student.class
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{student.sumscore ?? 0}</td>
              <td className="px-4 py-3 text-center whitespace-nowrap flex gap-2 justify-center">
                {editingId === student.id ? (
                  <>
                    <button
                      onClick={() => handleSave(student.id)}
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
                        onClick={() => handleViewActivities(student.id)}
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
                        onClick={() => onDeleteStudent(student.id)}
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
