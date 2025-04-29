'use client';

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ErrorModal } from "@/components/ErrorModal";
import LecturerStudentTable from "@/components/LecturerStudentTable";

interface Student {
  id: string;
  student_name: string;
  faculty: string;
  course: string;
  class: string;
  sumscore: number | null;
}

export default function LecturerStudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/students");
      setStudents(res.data.data.students);
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách sinh viên.");
      toast.error("Không thể tải danh sách sinh viên ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl text-gray-500">Đang tải sinh viên...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách Sinh viên</h1>

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      <div ref={tableRef} className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo tên, MSSV hoặc lớp..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
        />
      </div>

      <LecturerStudentTable students={filteredStudents} />
    </div>
  );
}
