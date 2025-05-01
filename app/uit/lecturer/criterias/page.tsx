'use client';

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import LecturerCriteriaTable from "@/components/LecturerCriteriaTable";
import Loading from "@/components/Loading";

interface Criteria {
  id: number;
  name: string;
  max_score: number;
}

export default function LecturerCriteriaManagement() {
  const [criterias, setCriterias] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchCriterias = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/criteria");
      setCriterias(res.data.data.criterias);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách tiêu chí ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriterias();
  }, []);

  const handleSortMaxScore = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
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

  const totalPages = Math.ceil(filteredCriterias.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCriterias = filteredCriterias.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách Tiêu chí</h1>
      <div ref={tableRef} className="mb-6">
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
      </div>

      {/* Bảng hiển thị */}
      <LecturerCriteriaTable 
        criterias={currentCriterias} 
        onSortMaxScore={handleSortMaxScore} 
        sortOrder={sortOrder}
      />

      {/* Phân trang */}
      {filteredCriterias.length > itemsPerPage && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => changePage(index + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
