'use client';

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import LecturerStudentTable from "@/components/LecturerStudentTable";
import Loading from "@/components/Loading";

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
  const [searchTerm, setSearchTerm] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/students");
      setStudents(res.data.data.students);
    } catch (err) {
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
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách Sinh viên</h1>
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
