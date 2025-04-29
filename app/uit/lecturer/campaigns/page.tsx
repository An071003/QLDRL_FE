'use client';

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ErrorModal } from "@/components/ErrorModal";
import LecturerCampaignTable from "@/components/LecturerCampaignTable";

interface Campaign {
  id: number;
  name: string;
  max_score: number;
  semester_name: string;
  start_year: number;
  end_year: number;
  semester: number; // cần thêm semester id để lọc
}

export default function LecturerCampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/campaigns");
      setCampaigns(res.data.data.campaigns);
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách phong trào.");
      toast.error("Không thể tải danh sách phong trào ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSortMaxScore = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const semesterOptions = [...new Set(
    campaigns.map(c => `${c.semester_name} (${c.start_year}-${c.end_year})|${c.semester}`)
  )];

  const filteredCampaigns = campaigns
    .filter((campaign) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((campaign) =>
      selectedSemester === "all" ? true : campaign.semester.toString() === selectedSemester
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.max_score - b.max_score;
      } else {
        return b.max_score - a.max_score;
      }
    });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl text-gray-500">Đang tải phong trào...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách Phong trào</h1>

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      <div ref={tableRef} className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Tìm kiếm theo tên phong trào..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
        />

        <select
          value={selectedSemester}
          onChange={(e) => {
            setSelectedSemester(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
        >
          <option value="all">Tất cả học kỳ</option>
          {semesterOptions.map((option) => {
            const [label, id] = option.split("|");
            return (
              <option key={id} value={id}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <LecturerCampaignTable
        campaigns={currentCampaigns}
        sortOrder={sortOrder}
        onSortMaxScore={handleSortMaxScore}
      />

      {filteredCampaigns.length > itemsPerPage && (
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
