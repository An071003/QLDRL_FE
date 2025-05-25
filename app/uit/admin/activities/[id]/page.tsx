"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import StudentActivitiesTable from "@/components/Table/StudentActivitiesTable";
import StudentActivitiesForm from "@/components/form/StudentActivitiesForm";
import StudentsActivitesImport from "@/components/Import/StudentsActivitesImport";
import { StudentActivity } from "@/types/studentActivity";
import { useParams } from "next/navigation";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useData } from "@/lib/contexts/DataContext";

export default function ActivityStudentManagement() {
  const params = useParams();
  const activityId = params?.id as string;
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<"table" | "form" | "import">("table");
  const tableRef = useRef<HTMLDivElement>(null);
  const [studentIdToDelete, setStudentIdToDelete] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { refreshActivities } = useData();

  const [canEdit, setCanEdit] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/student-activities/${activityId}`);
      const fetchedStudents = res.data.data.students;
      setStudents(fetchedStudents);
    } catch (err) {
      toast.error("Không thể tải danh sách sinh viên tham gia ❌");
    } finally {
      setLoading(false);
    }
  };

  // Tải thông tin activity và campaign tương ứng
  const fetchActivityInfo = async () => {
    try {
      // Tải thông tin activity 
      const activityRes = await api.get(`/api/activities/${activityId}`);
      const activity = activityRes.data.data.activity;

      if (activity.status === "ongoing") {
        const currentDate = new Date();
        const registrationStart = activity.registration_start ? new Date(activity.registration_start) : null;
        const registrationEnd = activity.registration_end ? new Date(activity.registration_end) : null;

        if (registrationStart && registrationEnd && 
            currentDate >= registrationStart && 
            currentDate <= registrationEnd) {
          setCanEdit(true);
        }
      }
    } catch (error: any) {
      toast.error("Không thể tải thông tin hoạt động:", error);
    }
  };
  
  useEffect(() => {
    fetchStudents();
    fetchActivityInfo();
  }, [activityId]);
  
  const handleAddStudents = async (studentIds: string[]) => {
    try {
      await api.post(`/api/student-activities/${activityId}/students`, { studentIds });
      await fetchStudents();
      await refreshActivities(); // Refresh activities data
      setActiveComponent("table");
      toast.success("Thêm sinh viên thành công 🎉");
    } catch (err) {
      toast.error("Thêm sinh viên thất bại ❌");
    }
  };

  const handleImportStudents = async (studentsToImport: { mssv: string }[]): Promise<{ success: boolean }> => {
    try {
      await api.post(`/api/student-activities/${activityId}/import`, { students: studentsToImport });
      await fetchStudents();
      await refreshActivities(); // Refresh activities data
      setActiveComponent("table");
      toast.success("Import sinh viên thành công 🚀");
      return { success: true };
    } catch (err) {
      toast.error("Import sinh viên thất bại ❌");
      return { success: false };
    }
  };

  const handleToggleParticipated = async (studentId: string, participated: boolean) => {
    try {
      await api.patch(`/api/student-activities/${activityId}`, {
        studentId: studentId,
        participated: participated,
      });
      await fetchStudents();
      await refreshActivities(); // Refresh activities data
      toast.success("Cập nhật trạng thái tham gia thành công ✅");
    } catch (err) {
      toast.error("Cập nhật trạng thái thất bại ❌");
    }
  };

  const handleRemoveStudent = (studentId: string) => {
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
      await refreshActivities(); // Refresh activities data
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
            <StudentActivitiesTable students={students} onRemoveStudent={handleRemoveStudent} onToggleParticipated={handleToggleParticipated}/>
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
              Quay về danh sách
            </button>
            {canEdit && (
              <>
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
            )}
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
