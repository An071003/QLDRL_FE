"use client";

import { useState } from "react";

interface CriteriaFormProps {
  onCriteriaCreated: (newCriteria: { name: string; max_score: number }) => Promise<{ success: boolean }>;
}

export default function CriteriaForm({ onCriteriaCreated }: CriteriaFormProps) {
  const [newCriteria, setNewCriteria] = useState({ name: "", max_score: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCriteria({ ...newCriteria, [name]: name === "max_score" ? Number(value) : value });
  };

  const handleCreateCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    console.log(newCriteria);
    try {
      const result = await onCriteriaCreated(newCriteria);
      if (result.success) {
        setNewCriteria({ name: "", max_score: 0 });
      } else {
        setError("Thêm tiêu chí thất bại.");
      }
    } catch (error) {
      console.error("Error creating criteria:", error);
      setError("Thêm tiêu chí thất bại.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-medium mb-4">Thêm mới Tiêu chí</h2>
      <form onSubmit={handleCreateCriteria} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Tiêu chí</label>
            <input
              type="text"
              name="name"
              value={newCriteria.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Điểm tối đa</label>
            <input
              type="number"
              name="max_score"
              value={newCriteria.max_score}
              onChange={handleInputChange}
              required
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 cursor-pointer text-white rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isCreating ? "Đang thêm..." : "Thêm tiêu chí"}
          </button>
        </div>
      </form>
    </div>
  );
}
