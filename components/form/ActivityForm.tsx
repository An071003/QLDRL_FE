"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Campaign } from "@/types/campaign";

interface ActivityFormProps {
  currentcampaigns: Campaign[];
  onActivityCreated: (activity: { 
    name: string; 
    point: number; 
    campaign_id: number; 
    is_negative: boolean; 
    negativescore: number;
    max_participants?: number;
    registration_start?: string;
    registration_end?: string;
  }) => Promise<{ success: boolean }>;
}

export default function ActivityForm({ currentcampaigns, onActivityCreated }: ActivityFormProps) {
  const [name, setName] = useState("");
  const [point, setPoint] = useState(0);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [isNegative, setIsNegative] = useState(false);
  const [negativeScore, setNegativeScore] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");

  useEffect(() => {
    setCampaigns(currentcampaigns);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !campaignId) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      toast.error("Phong trào không tồn tại.");
      return;
    }

    if (isNegative && negativeScore <= 0) {
      toast.error("Điểm trừ phải lớn hơn 0.");
      return;
    }
    if (point > (campaign?.campaign_max_score || 0)) {
      toast.error(`Điểm hoạt động không được lớn hơn điểm tối đa (${campaign?.campaign_max_score || 0}) của phong trào.`);
      return;
    }

    const result = await onActivityCreated({
      name,
      point,
      campaign_id: campaignId,
      is_negative: isNegative,
      negativescore: isNegative ? negativeScore : 0,
      max_participants: maxParticipants,
      registration_start: registrationStart || undefined,
      registration_end: registrationEnd || undefined,
    });
    if (result.success) {
      setName("");
      setPoint(0);
      setCampaignId(null);
      setIsNegative(false);
      setNegativeScore(0);
      setMaxParticipants(undefined);
      setRegistrationStart("");
      setRegistrationEnd("");
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
        {campaignId && (
          <p className="text-sm text-gray-500 mt-1">
            Điểm tối đa: {campaigns.find(c => c.id === campaignId)?.campaign_max_score}
          </p>
        )}
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

      <div>
        <label className="block mb-1">Số lượng tham gia tối đa (để trống nếu không giới hạn):</label>
        <input
          type="number"
          value={maxParticipants ?? ""}
          onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full border px-4 py-2 rounded-md"
          min={1}
        />
      </div>

      <div>
        <label className="block mb-1">Ngày bắt đầu đăng ký:</label>
        <input
          type="date"
          value={registrationStart}
          onChange={(e) => setRegistrationStart(e.target.value)}
          className="w-full border px-4 py-2 rounded-md"
        />
      </div>

      <div>
        <label className="block mb-1">Ngày kết thúc đăng ký:</label>
        <input
          type="date"
          value={registrationEnd}
          onChange={(e) => setRegistrationEnd(e.target.value)}
          className="w-full border px-4 py-2 rounded-md"
        />
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="submit"
          className="px-6 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
        >
          Tạo hoạt động
        </button>
      </div>
    </form>
  );
}
