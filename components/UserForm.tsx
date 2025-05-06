"use client";
import { NewUser } from "@/types/user";
import { useState } from "react";
import { toast } from "sonner";

export default function UserForm({
     onUserCreated,
     setLoading 
    }:{
        onUserCreated: (newUser: NewUser) => Promise<{ success: boolean }>,
        setLoading: (value: boolean) => void;
    }) {
    const [newUser, setNewUser] = useState<NewUser>({ name: '', email: '', role: 'student' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await onUserCreated(newUser);
            if (result.success) {
                setNewUser({ name: '', email: '', role: 'student' });
                toast.success('Tạo người dùng thành công');
            } else {
                toast.error('Lỗi tạo người dùng');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error('Lỗi tạo người dùng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-medium mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={newUser.name}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            name="role"
                            value={newUser.role}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="student">Student</option>
                            <option value="lecturer">Lecturer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        className="px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        'Tạo User'
                    </button>
                </div>
            </form>
        </div>
    );
}