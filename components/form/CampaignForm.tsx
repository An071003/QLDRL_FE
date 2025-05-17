"use client";

import { useEffect, useState } from "react";
import { Criteria } from "@/types/criteria";
import api from "@/lib/api";
import { toast } from "sonner";

interface CampaignFormProps {
  criteria: Criteria[];
  onCampaignCreated: (campaign: { 
    name: string; 
    max_score: number; 
    criteria_id: number; 
    semester_no: number; 
    academic_year: number 
  }) => Promise<{ success: boolean }>;
}

export default function CampaignForm({ criteria, onCampaignCreated }: CampaignFormProps) {
  const [name, setName] = useState("");
  const [maxScore, setMaxScore] = useState(0);
  const [criteriaId, setCriteriaId] = useState<number | null>(null);
  const [semesterNo, setSemesterNo] = useState<number>(1);
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
  const [criterias, setCriterias] = useState<Criteria[]>([]);

  useEffect(() => {
    const fetchCriterias = async () => {
      try {
        const res = await api.get("/api/criteria");
        setCriterias(res.data.data.criteria);
      } catch (err) {
        toast.error("Không thể tải danh sách tiêu chí.");
      }
    };
    fetchCriterias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !criteriaId || !semesterNo || !academicYear) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    const selectedCriteria = criterias.find(c => c.id === criteriaId);
    if (!selectedCriteria) {
      toast.error("Tiêu chí không hợp lệ.");
      return;
    }

    if (maxScore > selectedCriteria.max_score) {
      toast.error(`Điểm phong trào không được lớn hơn điểm tiêu chí (${selectedCriteria.max_score}).`);
      return;
    }

    const result = await onCampaignCreated({
      name,
      max_score: maxScore,
      criteria_id: criteriaId,
      semester_no: semesterNo,
      academic_year: academicYear
    });
    if (result.success) {
      setName("");
      setMaxScore(0);
      setCriteriaId(null);
      setSemesterNo(1);
      setAcademicYear(new Date().getFullYear());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1">Tên phong trào:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Điểm tối đa:</label>
        <input
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(Number(e.target.value))}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Tiêu chí:</label>
        <select
          value={criteriaId ?? ""}
          onChange={(e) => setCriteriaId(Number(e.target.value))}
          className="w-full border px-4 py-2 rounded-md"
          required
        >
          <option value="">-- Chọn tiêu chí --</option>
          {criterias.map((criteria) => (
            <option key={criteria.id} value={criteria.id}>
              {criteria.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Học kỳ:</label>
        <select
          value={semesterNo}
          onChange={(e) => setSemesterNo(Number(e.target.value))}
          className="w-full border px-4 py-2 rounded-md"
          required
        >
          <option value={1}>Học kỳ 1</option>
          <option value={2}>Học kỳ 2</option>
        </select>
      </div>

      <div>
        <label className="block mb-1">Năm học:</label>
        <input
          type="number"
          value={academicYear}
          onChange={(e) => setAcademicYear(Number(e.target.value))}
          className="w-full border px-4 py-2 rounded-md"
          min={2000}
          max={2100}
          required
        />
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="submit"
          className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
        >
          Tạo phong trào
        </button>
      </div>
    </form>
  );
}
