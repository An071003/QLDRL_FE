"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Campaign {
  id: number;
  name: string;
}

interface ActivityFormProps {
  onActivityCreated: (activity: { name: string; point: number; campaign_id: number; is_negative: boolean; negativescore: number }) => Promise<{ success: boolean }>;
}

export default function ActivityForm({ onActivityCreated }: ActivityFormProps) {
  const [name, setName] = useState("");
  const [point, setPoint] = useState(0);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [isNegative, setIsNegative] = useState(false);
  const [negativeScore, setNegativeScore] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.get("/api/campaigns");
        setCampaigns(res.data.data.campaigns);
      } catch (err) {
        toast.error("Không thể tải danh sách phong trào.");
      }
    };
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !campaignId) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    const result = await onActivityCreated({
      name,
      point,
      campaign_id: campaignId,
      is_negative: isNegative,
      negativescore: isNegative ? negativeScore : 0,
    });
    if (result.success) {
      setName("");
      setPoint(0);
      setCampaignId(null);
      setIsNegative(false);
      setNegativeScore(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1">Tên hoạt động:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Điểm:</label>
        <input
          type="number"
          value={point}
          onChange={(e) => setPoint(Number(e.target.value))}
          className="w-full border px-4 py-2 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Thuộc phong trào:</label>
        <select
          value={campaignId ?? ""}
          onChange={(e) => setCampaignId(Number(e.target.value))}
          className="w-full border px-4 py-2 rounded-md"
          required
        >
          <option value="">-- Chọn phong trào --</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Đây có phải hoạt động phạt điểm?</label>
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
        Tạo hoạt động
      </button>
    </form>
  );
}
