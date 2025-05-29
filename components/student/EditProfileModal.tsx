import React, { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Button, message } from "antd";
import dayjs from "dayjs";

interface UpdateProfileFormValues {
  student_name: string;
  phone?: string;
  birthdate?: dayjs.Dayjs;
}

interface EditProfileModalProps {
  visible: boolean;
  loading: boolean;
  initialValues: {
    student_name: string;
    phone?: string;
    birthdate?: string;
  };
  isDemoMode: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateProfileFormValues) => Promise<void>;
}

export default function EditProfileModal({
  visible,
  loading,
  initialValues,
  isDemoMode,
  onCancel,
  onSubmit
}: EditProfileModalProps) {
  const [form] = Form.useForm();

  const handleSubmit = async (values: UpdateProfileFormValues) => {
    if (isDemoMode) {
      message.warning("Không thể cập nhật trong chế độ demo!");
      return;
    }
    await onSubmit(values);
  };

  // Use effect to handle modal opening
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        student_name: initialValues.student_name,
        phone: initialValues.phone,
        birthdate: initialValues.birthdate ? dayjs(initialValues.birthdate) : null,
      });
    }
  }, [visible, initialValues, form]);

  return (
    <Modal
      title="Chỉnh sửa thông tin cá nhân"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          label="Họ và tên"
          name="student_name"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
        >
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { pattern: /^\d{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Ngày sinh"
          name="birthdate"
        >
          <DatePicker
            placeholder="Chọn ngày sinh"
            format="DD/MM/YYYY"
            className="w-full"
          />
        </Form.Item>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="bg-blue-600"
          >
            Cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
} 