"use client";

import { useState, useEffect, useRef } from "react";
import { Criteria } from "@/types/criteria";
import { toast } from "sonner";
import api from "@/lib/api";
import CriteriaForm from "@/components/form/CriteriaForm";
import CriteriaImport from "@/components/Import/CriteriaImport";
import CriteriaTable from "@/components/Table/CriteriaTable";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Loading from "@/components/Loading";
import axios from "axios";
import { useData } from "@/lib/contexts/DataContext";

export default function CriteriaManagement() {
  const { criteria: contextCriteria, loading: dataLoading, refreshData } = useData();
  const [criterias, setCriterias] = useState<Criteria[]>([]);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCriterias(contextCriteria || []);
  }, [contextCriteria]);

  const handleCreateCriteria = async (newCriteria: { name: string; max_score: number }) => {
    try {
      await api.post("/api/criteria", newCriteria);
      await refreshData();
      setActiveComponent("table");
      toast.success("Thêm tiêu chí thành công 🎉");

      return { success: true };
    } catch (error: unknown) {
      console.error(error);
      toast.error("Thêm tiêu chí thất bại ❌");
      return { success: false };
    }
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId === null) return;
    try {
      await api.delete(`/api/criteria/${selectedId}`);
      await refreshData();
      toast.success("Xóa tiêu chí thành công ✅");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Xóa tiêu chí thất bại ❌");
    } finally {
      setModalOpen(false);
      setSelectedId(null);
    }
  };

  const handleUpdateCriteria = async (id: number, updatedCriteria: { name: string; max_score: number }) => {
    try {
      await api.put(`/api/criteria/${id}`, updatedCriteria);
      await refreshData();
      toast.success("Cập nhật tiêu chí thành công ✨");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Cập nhật tiêu chí thất bại ❌");
    }
  };

  const handleCriteriasImported = async (importedCriterias: {
    name: string;
    max_score: number;
    created_by?: number;
    row_number?: number;
    error?: string;
  }[]) => {
    try {
      console.log("Attempting to import criteria:", importedCriterias);
      const response = await api.post("/api/criteria/import", importedCriterias);
      console.log("Import response:", response.data);
      
      await refreshData();
      setActiveComponent("table");
      
      if (response.data.status === "partial") {
        toast.success(`${response.data.message}`);
        console.log("Failed imports:", response.data.data.failed);
      } else {
        toast.success("Import tiêu chí thành công 🚀");
      }
      return { success: true };
    } catch (error: unknown) {
      console.error("Import error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Lỗi: ${error.response.data.message || "Import thất bại"} ❌`);
      } else {
        toast.error("Import tiêu chí thất bại ❌");
      }
      return { success: false };
    }
  };

  const handleSortMaxScore = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const filteredCriterias = criterias
    ? criterias
        .filter((criteria) =>
          criteria.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          if (sortOrder === "asc") {
            return a.max_score - b.max_score;
          } else {
            return b.max_score - a.max_score;
          }
        })
    : [];

  const totalPages = Math.ceil(filteredCriterias.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCriterias = filteredCriterias.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <CriteriaForm onCriteriaCreated={handleCreateCriteria} />;
      case "import":
        return <CriteriaImport onImported={handleCriteriasImported} />;
      default:
        return (
          <>
            <div ref={tableRef} className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm theo tên tiêu chí..."
                className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setActiveComponent("form")}
                  className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Thêm tiêu chí
                </button>
                <button
                  onClick={() => setActiveComponent("import")}
                  className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Import tiêu chí
                </button>
              </div>
            </div>

            <CriteriaTable
              criterias={currentCriterias}
              onDeleteCriteria={openDeleteModal}
              onUpdateCriteria={handleUpdateCriteria}
              onSortMaxScore={handleSortMaxScore}
              sortOrder={sortOrder}
            />

            {filteredCriterias.length > itemsPerPage && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 cursor-pointer rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => changePage(index + 1)}
                    className={`px-3 py-1 cursor-pointer rounded-md ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 cursor-pointer rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        );
    }
  };

  if (dataLoading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Tiêu chí</h1>

      {activeComponent !== "table" && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setActiveComponent("table")}
            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          >
            Quay về danh sách
          </button>
        </div>
      )}

      <div>{renderComponent()}</div>

      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
