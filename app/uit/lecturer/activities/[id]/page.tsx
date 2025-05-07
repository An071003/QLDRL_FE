"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { StudentActivity } from "@/types/studentActivity";
import LectureActivityStudentTable from "@/components/Table/LecturerStudentActivitiesTable";
import { useParams } from "next/navigation";

export default function LectureActivityStudentManagement() {
  const params = useParams();
  const activityId = params?.id as string;
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetchStudents();
  }, [activityId]);

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Sinh viên tham gia hoạt động</h1>
      <div className="flex justify-end gap-4 mb-6">
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => window.history.back()}>
          Quay về danh sách
        </button>
      </div>
      <div ref={tableRef}>
        <LectureActivityStudentTable students={students} />
      </div>
    </div >
  );
}