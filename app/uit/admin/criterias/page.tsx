"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { ErrorModal } from "@/components/ErrorModal";
import CriteriaForm from "@/components/CriteriaForm";
import CriteriaImport from "@/components/CriteriaImport";
import CriteriaTable from "@/components/CriteriaTable";

interface Criteria {
  id: number;
  name: string;
  max_score: number;
}

export default function CriteriaManagement() {
  const [criterias, setCriterias] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>("table");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // ➔ Thêm sortOrder

  const fetchCriterias = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/criteria");
      setCriterias(res.data.data.criterias);
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách tiêu chí.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriterias();
  }, []);

  const handleCreateCriteria = async (newCriteria: { name: string; max_score: number }) => {
    try {
      await api.post("/api/criteria", newCriteria);
      await fetchCriterias();
      setActiveComponent("table");
      setError("");
      return { success: true };
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi tạo tiêu chí.");
      return { success: false };
    }
  };

  const handleDeleteCriteria = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tiêu chí này?")) return;
    try {
      await api.delete(`/api/criteria/${id}`);
      await fetchCriterias();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi xóa tiêu chí.");
    }
  };

  const handleUpdateCriteria = async (id: number, updatedCriteria: { name: string; max_score: number }) => {
    try {
      await api.put(`/api/criteria/${id}`, updatedCriteria);
      await fetchCriterias();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi cập nhật tiêu chí.");
    }
  };

  const handleCriteriasImported = async (importedCriterias: Criteria[]) => {
    try {
      await api.post("/api/criteria/import", importedCriterias);
      await fetchCriterias();
      setActiveComponent("table");
      return { success: true };
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi import tiêu chí.");
      return { success: false };
    }
  };

  const handleSortMaxScore = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const filteredCriterias = criterias
    .filter((criteria) =>
      criteria.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.max_score - b.max_score;
      } else {
        return b.max_score - a.max_score;
      }
    });

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <CriteriaForm onCriteriaCreated={handleCreateCriteria} />;
      case "import":
        return <CriteriaImport onCriteriasImported={handleCriteriasImported} />;
      default:
        return (
          <>
            <div className="mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên tiêu chí..."
                className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
              />
            </div>
            <CriteriaTable
              criterias={filteredCriterias}
              onDeleteCriteria={handleDeleteCriteria}
              onUpdateCriteria={handleUpdateCriteria}
              onSortMaxScore={handleSortMaxScore}  // ➔ Truyền thêm hàm sort
              sortOrder={sortOrder}  // ➔ Truyền trạng thái sort
            />
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Đang tải tiêu chí...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Tiêu chí</h1>

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      <div className="flex justify-end gap-4 mb-6">
        {activeComponent === "table" ? (
          <>
            <button
              onClick={() => setActiveComponent("form")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm tiêu chí
            </button>
            <button
              onClick={() => setActiveComponent("import")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import tiêu chí
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveComponent("table")}
            className="px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        )}
      </div>

      <div>{renderComponent()}</div>
    </div>
  );
}
