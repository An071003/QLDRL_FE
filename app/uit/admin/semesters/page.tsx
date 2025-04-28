"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Semester } from "@/types/semester";
import SemesterTable from "@/components/SemesterTable";
import { toast } from "sonner";
import { ErrorModal } from "@/components/ErrorModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { NotificationModal } from "@/components/NotificationModal";

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/semesters");
      setSemesters(res.data.data.semesters);
    } catch (error) {
      console.error(error);
      setError("Lỗi tải danh sách học kỳ.");
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
      setNotifMessage("Thêm học kỳ mới thành công!");
      setNotifOpen(true);
    } catch (error) {
      console.error(error);
      setError("Lỗi khi thêm học kỳ mới.");
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
      setNotifMessage("Xóa học kỳ thành công!");
      setNotifOpen(true);
    } catch (error) {
      console.error(error);
      setError("Lỗi khi xóa học kỳ.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý học kỳ</h1>
      {error && (
        <ErrorModal message={error} onClose={() => setError("")} />
      )}

      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDeleteSemester}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa học kỳ này không?"
      />

      <NotificationModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        message={notifMessage}
      />

      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddSemester}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
