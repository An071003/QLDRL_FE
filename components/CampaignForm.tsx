"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Criteria {
  id: number;
  name: string;
}

interface CampaignFormProps {
  onCampaignCreated: (campaign: { name: string; max_score: number; criteria_id: number; is_negative: boolean; negativescore: number }) => Promise<{ success: boolean }>;
}

export default function CampaignForm({ onCampaignCreated }: CampaignFormProps) {
  const [name, setName] = useState("");
  const [maxScore, setMaxScore] = useState(0);
  const [criteriaId, setCriteriaId] = useState<number | null>(null);
  const [isNegative, setIsNegative] = useState(false);
  const [negativeScore, setNegativeScore] = useState(0);
  const [criterias, setCriterias] = useState<Criteria[]>([]);

  useEffect(() => {
    const fetchCriterias = async () => {
      try {
        const res = await api.get("/api/criteria");
        setCriterias(res.data.data.criterias);
      } catch (err) {
        toast.error("Không thể tải danh sách tiêu chí.");
      }
    };
    fetchCriterias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !criteriaId) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    const result = await onCampaignCreated({
      name,
      max_score: maxScore,
      criteria_id: criteriaId,
      is_negative: isNegative,
      negativescore: isNegative ? negativeScore : 0,
    });
    if (result.success) {
      setName("");
      setMaxScore(0);
      setCriteriaId(null);
      setIsNegative(false);
      setNegativeScore(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1">Tên chiến dịch:</label>
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
        <label className="block mb-1">Có phải điểm trừ?</label>
        <select
          value={isNegative ? "true" : "false"}
          onChange={(e) => setIsNegative(e.target.value === "true")}
          className="w-full border px-4 py-2 rounded-md"
        >
          <option value="false">Không</option>
          <option value="true">Có</option>
        </select>
      </div>

      {isNegative && (
        <div>
          <label className="block mb-1">Điểm trừ:</label>
          <input
            type="number"
            value={negativeScore}
            onChange={(e) => setNegativeScore(Number(e.target.value))}
            className="w-full border px-4 py-2 rounded-md"
            min={0}
            required
          />
        </div>
      )}

      <button
        type="submit"
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Tạo chiến dịch
      </button>
    </form>
  );
}
