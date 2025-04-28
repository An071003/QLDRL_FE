'use client';

import React from "react";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
    });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log(form);
            await api.post("/api/auth/register", form);
            alert('Đăng ký thành công!');
            router.push('/login');
        } catch (err) {
            console.error(err);
            alert('Đăng ký thất bại.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-4">Đăng ký tài khoản</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" placeholder="Họ tên" onChange={handleChange} className="w-full border p-2 rounded" required />
                <input name="email" placeholder="Email" onChange={handleChange} className="w-full border p-2 rounded" required />
                <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} className="w-full border p-2 rounded" required />
                <select name="role" value={form.role} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="student">Sinh viên</option>
                    <option value="lecturer">Giảng viên</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">Đăng ký</button>
            </form>
        </div>
    );
}
