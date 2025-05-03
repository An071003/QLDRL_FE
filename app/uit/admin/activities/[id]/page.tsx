"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import StudentActivitiesTable from "@/components/StudentActivitiesTable";
import StudentActivitiesForm from "@/components/StudentActivitiesForm";
import StudentsActivitesImport from "@/components/StudentsActivitesImport";
import { Student } from "@/types/student";
import { useParams } from "next/navigation";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

export default function ActivityStudentManagement() {
  const params = useParams();
  const activityId = params?.id as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<"table" | "form" | "import">("table");
  const tableRef = useRef<HTMLDivElement>(null);
  const [studentIdToDelete, setStudentIdToDelete] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/student-activities/${activityId}`);
      setStudents(res.data.data.students);
    } catch (err) {
      toast.error("Không thể tải danh sách sinh viên tham gia ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activityId) fetchStudents();
  }, [activityId]);

  const handleAddStudents = async (studentIds: number[]) => {
    try {
      await api.post(`/api/student-activities/${activityId}/students`, { studentIds });
      await fetchStudents();
      setActiveComponent("table");
      toast.success("Thêm sinh viên thành công 🎉");
    } catch (err) {
      toast.error("Thêm sinh viên thất bại ❌");
    }
  };

  const handleImportStudents = async (studentsToImport: { mssv: string }[]) => {
    try {
      await api.post(`/api/student-activities/${activityId}/students/import`, { students: studentsToImport });
      await fetchStudents();
      setActiveComponent("table");
      toast.success("Import sinh viên thành công 🚀");
    } catch (err) {
      toast.error("Import sinh viên thất bại ❌");
    }
  };

  const handleRemoveStudent = (studentId: number) => {
    setStudentIdToDelete(studentId);
    setConfirmDeleteOpen(true);
  };

  const confirmRemoveStudent = async () => {
    if (studentIdToDelete === null) {
      toast.error("Không có sinh viên để xóa.");
      return;
    }
    try {
      await api.delete(`/api/student-activities/${activityId}/students/${studentIdToDelete}`);
      await fetchStudents();
      toast.success("Xóa sinh viên khỏi hoạt động thành công ✅");
    } catch (err) {
      toast.error("Xóa sinh viên thất bại ❌");
    } finally {
      setConfirmDeleteOpen(false);
      setStudentIdToDelete(null);
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <StudentActivitiesForm activityId={activityId} onAddStudents={handleAddStudents} />;
      case "import":
        return <StudentsActivitesImport onImport={handleImportStudents} />;
      default:
        return (
          <div ref={tableRef}>
            <StudentActivitiesTable students={students} onRemoveStudent={handleRemoveStudent} />
          </div>
        );
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Sinh viên tham gia hoạt động</h1>

      <ConfirmDeleteModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmRemoveStudent}
      />

      <div className="flex justify-end gap-4 mb-6">
        {activeComponent === "table" ? (
          <>
            <button
              className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
              onClick={() => window.history.back()}>
              Quay lại hoạt động
            </button>
            <button
              onClick={() => setActiveComponent("form")}
              className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm sinh viên
            </button>
            <button
              onClick={() => setActiveComponent("import")}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import từ Excel
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveComponent("table")}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        )}
      </div>
      {renderComponent()}
    </div>
  );
}
