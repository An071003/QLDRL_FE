"use client";

import { useState, useEffect} from "react";
import api from "@/lib/api";
import { Semester } from "@/types/semester";
import SemesterTable from "@/components/Table/SemesterTable";
import { toast } from "sonner";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/semesters");
      setSemesters(res.data.data.semesters);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleAddSemester = async () => {
    try {
      await api.post("/api/semesters");
      await fetchSemesters();
      toast.success("Thêm học kỳ thành công!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSemester = async (id: number) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const confirmDeleteSemester = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/api/semesters/${selectedId}`);
      await fetchSemesters();
      toast.success("Xóa học kỳ thành công!");
      setModalOpen(false);
    } catch {
      toast.error("Xóa học kỳ thất bại!");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý học kỳ</h1>
      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDeleteSemester}
      />

      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddSemester}
          className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Thêm học kỳ
        </button>
      </div>

      <SemesterTable
        semesters={semesters}
        loading={loading}
        onDeleteSemester={handleDeleteSemester}
      />
    </div>
  );
}
