'use client';

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import LecturerActivityTable from "@/components/LecturerActivityTable";
import Loading from "@/components/Loading";

interface Activity {
  id: number;
  name: string;
  point: number;
  is_negative: boolean;
  campaign_name: string;
}

export default function LecturerActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/activities");
      setActivities(res.data.data.activities);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách hoạt động ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách Hoạt động</h1>
      <div ref={tableRef} className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo tên hoạt động..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
        />
      </div>

      <LecturerActivityTable activities={filteredActivities} />
    </div>
  );
}
