'use client';

import { NewUser } from "@/types/user";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useData } from "@/lib/contexts/DataContext";

export default function UserForm({
  onUserCreated,
  setLoading,
  roles
}: {
  onUserCreated: (newUser: { 
    user_name: string; 
    email: string; 
    role_id: number;
  }) => Promise<{ success: boolean; message: any; }>;
  setLoading: (value: boolean) => void;
  roles: { id: number; name: string }[];
}) {
  const { getFilteredClasses } = useData();
  
  const [newUser, setNewUser] = useState<NewUser>({
    user_name: '',
    email: '',
    role_id: '',
  });


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: ['role_id'].includes(name) 
        ? (value === "" ? "" : Number(value)) 
        : value,
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userForCreation = {
      ...newUser,
      role_id: newUser.role_id === "" ? 0 : Number(newUser.role_id),
    };

    try {
      const result = await onUserCreated(userForCreation);
      if (result.success) {
        setNewUser({ 
          user_name: '', 
          email: '', 
          role_id: '',
        });
        toast.success("Tạo người dùng thành công");
      } else {
        toast.error("Lỗi tạo người dùng");
      }
    } catch (error) {
      toast.error("Lỗi tạo người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-medium mb-4">Tạo user mới</h2>
      <form onSubmit={handleCreateUser} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên user</label>
            <input
              type="text"
              name="user_name"
              value={newUser.user_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <select
              name="role_id"
              value={newUser.role_id}
              onChange={handleInputChange}
              required
              className="w-auto px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>-- Chọn vai trò --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
          >
            Tạo User
          </button>
        </div>
      </form>
    </div>
  );
}
