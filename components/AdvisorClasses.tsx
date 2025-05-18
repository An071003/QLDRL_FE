import { Class } from '@/types/class';

interface AdvisorClassesProps {
  classes: Class[] | undefined;
}

export default function AdvisorClasses({ classes }: AdvisorClassesProps) {
  if (!classes || classes.length === 0) {
    return (
      <div className="px-6 py-4 bg-gray-50 text-gray-500">
        Cố vấn này chưa được phân công lớp nào.
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-gray-50">
      <h3 className="font-semibold mb-2 text-gray-700">Danh sách lớp phụ trách:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {classes.map(cls => (
          <div key={cls.id} className="p-2 rounded border border-gray-200 bg-white">
            {cls.name}
          </div>
        ))}
      </div>
    </div>
  );
} 