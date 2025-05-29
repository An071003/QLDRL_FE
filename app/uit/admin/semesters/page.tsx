"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Loading from '@/components/Loading';
import { Table, Button, Form, InputNumber, Select, Modal, message } from 'antd';

const { Option } = Select;

interface Semester {
  semester_no: number;
  academic_year: number;
}

export default function SemestersPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/student-scores/semesters');
      setSemesters(res.data.data.semesters as Semester[]);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      message.error('Không thể tải dữ liệu học kỳ');
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleSubmit = async (values: { semester_no: number; academic_year: number }) => {
    try {
      setSubmitting(true);
      await api.post('/api/student-scores/new-semester', values);
      message.success('Đã tạo học kỳ mới thành công');
      form.resetFields();
      setIsModalOpen(false);
      fetchSemesters();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error creating semester:', error);
      message.error(err.response?.data?.message || 'Không thể tạo học kỳ mới');
    } finally {
      setSubmitting(false);
    }
  };

  const semesterColumns = [
    {
      title: 'Học kỳ',
      dataIndex: 'semester_no',
      key: 'semester_no',
    },
    {
      title: 'Năm học',
      dataIndex: 'academic_year',
      key: 'academic_year',
      render: (year: number) => `${year}-${year + 1}`,
    },
    {
      title: 'Mô tả',
      key: 'description',
      render: (record: Semester) => `Học kỳ ${record.semester_no}, năm học ${record.academic_year}-${record.academic_year + 1}`,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: Semester) => (
        <Button 
          danger 
          onClick={() => handleDeleteClick(record)}
        >
          Xóa
        </Button>
      ),
    }
  ];

  const handleDeleteClick = (semester: Semester) => {
    setSemesterToDelete(semester);
    setModalOpen(true);
  };

  const confirmDeleteSemester = async () => {
    if (!semesterToDelete) return;
    
    try {
      await api.delete(`/api/student-scores/semester/${semesterToDelete.semester_no}/${semesterToDelete.academic_year}`);
      message.success('Xóa học kỳ thành công');
      fetchSemesters();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error deleting semester:', error);
      message.error(err.response?.data?.message || 'Không thể xóa học kỳ');
    } finally {
      setModalOpen(false);
      setSemesterToDelete(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý học kỳ</h1>
        <Button type="primary" onClick={showModal}>
          Thêm học kỳ mới
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <Table
          dataSource={semesters}
          columns={semesterColumns}
          rowKey={(record) => `${record.semester_no}_${record.academic_year}`}
          pagination={false}
        />
      </div>

      <Modal
        title="Thêm học kỳ mới"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <div className="p-4">
          <p className="mb-4 text-red-500">
            Lưu ý: Khi tạo học kỳ mới, hệ thống sẽ đánh dấu các hoạt động của học kỳ trước là hết hạn. 
            Đồng thời, hệ thống cũng sẽ khởi tạo bảng điểm mới cho tất cả sinh viên.
          </p>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="semester_no"
              label="Học kỳ"
              rules={[{ required: true, message: 'Vui lòng chọn học kỳ' }]}
            >
              <Select placeholder="Chọn học kỳ">
                <Option value={1}>Học kỳ 1</Option>
                <Option value={2}>Học kỳ 2</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="academic_year"
              label="Năm học bắt đầu"
              rules={[{ required: true, message: 'Vui lòng nhập năm học' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={2000}
                max={2100}
                placeholder="VD: 2023 (cho năm học 2023-2024)"
              />
            </Form.Item>

            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo học kỳ
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDeleteSemester}
      />
    </div>
  );
}
