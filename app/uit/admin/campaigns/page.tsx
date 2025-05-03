"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Campaign } from "@/types/campaign";
import { Criteria } from "@/types/criteria";
import CampaignForm from "@/components/CampaignForm";
import CampaignImport from "@/components/CampaignImport";
import CampaignTable from "@/components/CampaignTable";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Loading from "@/components/Loading";

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [criterias, setCriterias] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'form' | 'import' | 'table'>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
      toast.error("Không thể tải danh sách phong trào ❌");
    } finally {
      setLoading(false);
    }
  };

  const fetchCriterias = async () => {
    try {
      const res = await api.get("/api/criteria");
      setCriterias(res.data.data.criterias);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách tiêu chí ❌");
    }
  };


  useEffect(() => {
    fetchCampaigns();
    fetchCriterias();
  }, []);

  const handleCreateCampaign = async (newCampaign: { name: string; max_score: number; criteria_id: number; is_negative: boolean; negativescore: number }) => {
    try {
      await api.post("/api/campaigns", newCampaign);
      await fetchCampaigns();
      setActiveComponent("table");
      toast.success("Thêm phong trào thành công 🎉");
      return { success: true };
    } catch (err: any) {
      toast.error("Thêm phong trào thất bại ❌");
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
      await api.delete(`/api/campaigns/${selectedId}`);
      await fetchCampaigns();
      toast.success("Xóa phong trào thành công ✅");
    } catch (err: any) {
      toast.error("Xóa phong trào thất bại ❌");
    } finally {
      setModalOpen(false);
      setSelectedId(null);
    }
  };

  const handleUpdateCampaign = async (id: number, updatedCampaign: { name: string; max_score: number; criteria_id: number; negativescore: number }) => {
    try {
      await api.put(`/api/campaigns/${id}`, updatedCampaign);
      await fetchCampaigns();
      toast.success("Cập nhật phong trào thành công ✨");
    } catch (err: any) {
      toast.error("Cập nhật phong trào thất bại ❌");
    }
  };

  const handleCampaignsImported = async (importedCampaigns: { name: string; max_score: number; criteria_id: number; is_negative: boolean; negativescore: number }[]) => {
    try {
      await api.post("/api/campaigns/import", importedCampaigns);
      await fetchCampaigns();
      setActiveComponent("table");
      toast.success("Import phong trào thành công 🚀");
      return { success: true };
    } catch (err: any) {
      toast.error("Import phong trào thất bại ❌");
      return { success: false };
    }
  };

  const handleSortMaxScore = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const semesterOptions = [...new Set(campaigns.map(c => `${c.semester_name} (${c.start_year}-${c.end_year})|${c.semester}`))];

  const filteredCampaigns = campaigns
    .filter((campaign) =>
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((campaign) =>
      selectedSemester === "all" ? true : campaign.semester.toString() === selectedSemester
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.campaign_max_score - b.campaign_max_score;
      } else {
        return b.campaign_max_score - a.campaign_max_score;
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

  const renderComponent = () => {
    switch (activeComponent) {
      case "form":
        return <CampaignForm criteria={criterias} onCampaignCreated={handleCreateCampaign} />;
      case "import":
        return <CampaignImport onCampaignsImported={handleCampaignsImported} />;
      default:
        return (
          <>
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

            <CampaignTable
              campaigns={currentCampaigns}
              criterias={criterias}
              onDeleteCampaign={openDeleteModal}
              onUpdateCampaign={handleUpdateCampaign}
              onSortMaxScore={handleSortMaxScore}
              sortOrder={sortOrder}
            />

            {filteredCampaigns.length > itemsPerPage && (
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
                    className={`px-3 py-1 cursor-pointer rounded-md ${
                      currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
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

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Quản lý Phong trào</h1>
      <div className="flex justify-end gap-4 mb-6">
        {activeComponent === "table" ? (
          <>
            <button
              onClick={() => setActiveComponent("form")}
              className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm phong trào
            </button>
            {/* <button
              onClick={() => setActiveComponent("import")}
              className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import phong trào
            </button> */}
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

      <div>{renderComponent()}</div>

      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
