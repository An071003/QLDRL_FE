"use client";

interface Criteria {
  id: number;
  name: string;
  max_score: number;
}

interface CriteriaTableProps {
  criterias: Criteria[];
  onDeleteCriteria: (id: number) => void;
}

export default function CriteriaTable({ criterias, onDeleteCriteria }: CriteriaTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              STT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên Tiêu chí
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Điểm tối đa
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {criterias.map((criteria, index) => (
            <tr key={criteria.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{criteria.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{criteria.max_score}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onDeleteCriteria(criteria.id)}
                  className="text-red-600 hover:text-red-900 ml-2"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
