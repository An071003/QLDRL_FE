"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { StudentActivity } from "@/types/studentActivity";
import Loading from "../Loading";


interface Props {
    activityId: string;
    onAddStudents: (studentIds: number[]) => void;
}

export default function StudentActivitiesForm({ activityId, onAddStudents }: Props) {
    const [students, setStudents] = useState<StudentActivity[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [studentLength, setStudentLength] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const fetchUnjoinedStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/student-activities/${activityId}/not-participated`);
            setStudents(res.data.data.students);
            setStudentLength(res.data.data.students.length);
        } catch {
            toast.error("Không thể tải danh sách sinh viên ❌");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnjoinedStudents();
    }, []);

    const toggleSelect = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (selected.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một sinh viên");
            return;
        }
        onAddStudents(selected);
    };

    if (loading) {
        return (
            <Loading />
        );
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Chọn sinh viên để thêm</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Check</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {studentLength === 0 ?
                            (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">
                                        Không có sinh viên nào tham gia hoạt động 
                                    </td>
                                </tr>
                            ) :
                            students.map((s, index) => (
                                <tr key={s.student_id} className="border-t">
                                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.student_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.student_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.class}</td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(s.student_id)}
                                            onChange={() => toggleSelect(s.student_id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            {studentLength !== 0 && (
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 cursor-pointer rounded text-white bg-green-500 hover:bg-green-700"
                    >
                        Xác nhận thêm
                    </button>
                </div>
            )}
        </div>
    );
}
