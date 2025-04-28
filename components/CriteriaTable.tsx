"use client";

interface Criteria {
  id: number;
  name: string;
  max_score: number;
}

interface CriteriaTableProps {
  criterias: Criteria[];
  onDeleteCriteria: (id: number) => void;
  onUpdateCriteria: (id: number, updatedCriteria: { name: string; max_score: number }) => void;
  onSortMaxScore: () => void;
  sortOrder: "asc" | "desc";
}

export default function CriteriaTable({ criterias, onDeleteCriteria, onUpdateCriteria, onSortMaxScore, sortOrder }: CriteriaTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Tiêu chí</th>
            <th
              onClick={onSortMaxScore}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
            >
              Điểm tối đa {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {criterias.length > 0 ? (
            criterias.map((criteria, index) => (
              <tr key={criteria.id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{criteria.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{criteria.max_score}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => {
                      const newName = prompt("Nhập tên tiêu chí mới:", criteria.name);
                      const newMaxScore = prompt("Nhập điểm tối đa mới:", criteria.max_score.toString());

                      if (newName && newMaxScore && !isNaN(parseInt(newMaxScore))) {
                        onUpdateCriteria(criteria.id, { name: newName.trim(), max_score: parseInt(newMaxScore) });
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDeleteCriteria(criteria.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-6 text-gray-500">
                Không có tiêu chí nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
