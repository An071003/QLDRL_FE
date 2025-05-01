"use client";

import { useState, useRef } from 'react';
import { UploadCloud } from "lucide-react";
import ExcelJS from 'exceljs';
import { toast } from 'sonner';

export default function UserImport({
  onUsersImported,
}: {
  onUsersImported: (users: any[]) => Promise<{ success: boolean }>;
}) {
  const [loading, setLoading] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const users: any[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = row.getCell(1).value?.toString() || '';
        const email = row.getCell(2).value?.toString() || '';
        const role = row.getCell(3).value?.toString() || 'student';

        users.push({ name, email, role });
      });

      setPreviewUsers(users);
    } catch (err) {
      console.error('Error reading file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (index: number, key: string, value: string) => {
    setPreviewUsers(prev => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setPreviewUsers(prev => prev.filter((_, i) => i !== index));
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleImport = async () => {
    setLoading(true);
    const invalidUsers = previewUsers.filter(user => !isValidEmail(user.email));
    if (invalidUsers.length > 0) {
      toast.error("Một số email không hợp lệ");
      setLoading(false);
      return;
    }
    if (previewUsers.length > 0) {
      const result = await onUsersImported(previewUsers);

      if (result.success) {
        setPreviewUsers([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">
          Import users from Excel
        </p>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
          Choose File
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      {previewUsers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Preview & Edit Users</h3>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {previewUsers.map((user, idx) => (
                <tr key={idx}>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="text"
                      value={user.name}
                      onChange={(e) => handleUserChange(idx, "name", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      className="w-full border rounded p-1"
                      type="email"
                      value={user.email}
                      onChange={(e) => handleUserChange(idx, "email", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      className="w-full border rounded p-1"
                      value={user.role}
                      onChange={(e) => handleUserChange(idx, "role", e.target.value)}
                    >
                      <option value="student">student</option>
                      <option value="lecturer">lecturer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleImport}
              className={'px-6 py-2 rounded text-white bg-green-500 hover:bg-green-700'}
            >
              Tạo Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
