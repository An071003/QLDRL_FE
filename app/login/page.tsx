"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { MainLayout } from "@/components/layout/main";
import { Button, Input, Form, Typography, Space } from "antd";
import Link from "next/link";
import { toast } from "sonner";

const { Title } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await api.post("/api/auth/login", values);
      router.push("/uit");
    } catch (err: any) {
      toast.error(err.response.data.message || "Đăng nhập không thành công.");
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-5 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xs">
          <Title level={2} className="text-center">
            Đăng nhập
          </Title>
        </div>

        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{ user_name: "", password: "" }}
          >
            <Form.Item
              label="Tên truy cập"
              name="user_name"
              rules={[{ required: true, message: "Vui lòng nhập tên truy cập!" }]}
            >
              <Input placeholder="Tên truy cập" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                size="large"
              >
                Đăng nhập
              </Button>
            </Form.Item>

            <Space className="w-full justify-center">
              <Link href="/reset-password">Quên mật khẩu?</Link>
            </Space>
          </Form>
        </div>
      </div>
    </MainLayout>
  );
}
