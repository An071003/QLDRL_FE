"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import ActivitiesStudentTable from "@/components/Table/ActivitiesStudentTable";
import { StudentActivity } from "@/types/studentActivity";
import { toast } from "sonner";

export default function StudentActivitiesPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 20;

  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/student-activities/${studentId}/all`);
        if (Array.isArray(res.data.data)) {
          setActivities(res.data.data);
        } else if (res.data.studentActivity) {
          setActivities([res.data.studentActivity]);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Failed to fetch student activities:', error);
        toast.error("Không thể tải hoạt động sinh viên ❌");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [studentId]);

  const totalPages = Math.max(1, Math.ceil(activities.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = activities.slice(indexOfFirstItem, indexOfLastItem);

  const changePage = (page: number) => {
    setCurrentPage(page);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách hoạt động của sinh viên {studentId}</h1>
      <div className="flex justify-end gap-4 mb-6">
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => window.history.back()}>
          Quay về danh sách
        </button>
      </div>
      <div ref={tableRef}>
        <ActivitiesStudentTable activities={currentActivities} />
      </div>

      {activities.length > itemsPerPage && (
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
              className={`px-3 py-1 cursor-pointer rounded-md ${currentPage === index + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
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
    </div>
  );
}
