"use client";

import { useState, useRef } from 'react';
import { UploadCloud } from "lucide-react";
import ExcelJS from 'exceljs';
import { Result } from 'postcss';

export default function UserImport({ onUsersImported }: { onUsersImported: (users: any[]) => void }) {
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

  const handleImport = async () => {
    if (previewUsers.length > 0) {
      const result = await onUsersImported(previewUsers);
      if (result.success) {
        setPreviewUsers([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">
          Import users from Excel
        </p>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
          {loading ? "Loading..." : "Choose File"}
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
          <h3 className="text-xl font-bold mb-4">Preview Users</h3>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {previewUsers.map((user, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
