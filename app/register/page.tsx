'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, Button, Typography, notification } from 'antd';
import api from '@/lib/api';
import { MainLayout } from '@/components/layout';
import { toast } from 'sonner';
const { Title } = Typography;
const { Option } = Select;

export default function RegisterPage() {
    const [form] = Form.useForm();
    const router = useRouter();
    const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await api.get('/api/roles');
                setRoles(res.data.roles);
            } catch (err) {
                console.error("Không thể tải danh sách quyền:", err);
                notification.error({ message: "Lỗi", description: "Không thể tải danh sách vai trò" });
            }
        };

        fetchRoles();
    }, []);

    const handleSubmit = async (values: any) => {
        try {
            await api.post("/api/auth/register", values);
            toast.success("Đăng ký thành công!");
            router.push('/login');
        } catch (err) {
            toast.error("Đăng ký thất bại.");
        }
    };

    return (
        <MainLayout>
            <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
                <Title level={2}>Đăng ký tài khoản</Title>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ role_id: 1 }}
                >
                    <Form.Item
                        label="Họ tên"
                        name="user_name"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input placeholder="Nhập họ tên" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input placeholder="Nhập email" />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <Form.Item
                        label="Vai trò"
                        name="role_id"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select placeholder="Chọn vai trò">
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>
                                    {role.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </MainLayout>
    );
}
