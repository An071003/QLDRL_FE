  "use client";

  import { useState } from "react";
  import { StudentActivity } from "@/types/studentActivity";

  interface Props {
    students: StudentActivity[];
  }

  export default function LecturerStudentActivitiesTable({
    students
  }: Props) {
    const [search, setSearch] = useState("");
    const filtered = students.filter((s) =>
      `${s.student_id} ${s.student_name} ${s.class}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Danh sách sinh viên đã tham gia</h2>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm sinh viên..."
          className="mb-4 px-3 py-2 border border-gray-300 rounded w-full md:w-1/2"
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, index) => (
                <tr key={s.student_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.student_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.class}</td>
                  <td className="px-6 py-4 text-center w-48 whitespace-nowrap">
                    {s.participated ? (
                      "Đã tham gia"
                    ) : (
                      "Chưa tham gia"
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    Không có sinh viên nào phù hợp với tìm kiếm của bạn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
