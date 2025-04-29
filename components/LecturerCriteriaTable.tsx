'use client';

interface Criteria {
  id: number;
  name: string;
  max_score: number;
}

interface LecturerCriteriaTableProps {
  criterias: Criteria[];
  sortOrder: "asc" | "desc";
  onSortMaxScore: () => void;
}

export default function LecturerCriteriaTable({ criterias, sortOrder, onSortMaxScore }: LecturerCriteriaTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Tiêu chí</th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={onSortMaxScore}
            >
              Điểm Tối Đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {criterias.map((criteria, index) => (
            <tr key={criteria.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{criteria.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{criteria.max_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
