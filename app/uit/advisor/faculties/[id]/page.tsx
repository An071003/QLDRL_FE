'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Space, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

interface Class {
  id: number;
  name: string;
  cohort: string;
  faculty_id: number;
  student_count?: number;
}

interface Faculty {
  id: number;
  name: string;
  description?: string;
}

type TableRecord = Record<string, any>;

export default function AdvisorFacultyClassesPage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (facultyId) {
      fetchFacultyAndClasses();
    }
  }, [facultyId]);

  const fetchFacultyAndClasses = async () => {
    setLoading(true);
    try {
      // Fetch faculty details
      const facultyRes = await api.get(`/api/faculties/${facultyId}`);
      setFaculty(facultyRes.data.data.faculty);
      
      // Fetch classes in this faculty
      const classesRes = await api.get(`/api/faculties/${facultyId}/classes`);
      if (Array.isArray(classesRes.data.data)) {
        setClasses(classesRes.data.data);
      } else if (classesRes.data.data.classes) {
        setClasses(classesRes.data.data.classes);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Không thể tải dữ liệu khoa và lớp');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cohort.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classes, searchTerm]);

  const columns = [
    {
      title: 'Mã lớp',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: Class, b: Class) => a.id - b.id,
    },
    {
      title: 'Tên lớp',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Class, b: Class) => a.name.localeCompare(b.name),
      render: (text: string) => (
        <Tooltip title={text}>
          <div className="max-w-xs truncate">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: 'Khóa',
      dataIndex: 'cohort',
      key: 'cohort',
      sorter: (a: Class, b: Class) => a.cohort.localeCompare(b.cohort),
    },
    {
      title: 'Số sinh viên',
      dataIndex: 'student_count',
      key: 'student_count',
      render: (text: number, record: Class) => text || 0,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: TableRecord, record: Class) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => router.push(`/uit/advisor/classes/${record.id}`)}
          >
            Xem sinh viên
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lớp thuộc khoa {faculty?.name}</h1>
        <button
          className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
          onClick={() => window.history.back()}>
          Quay về danh sách
        </button>
      </div>

      {faculty && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Tên khoa:</p>
              <p className="font-medium">{faculty.name}</p>
            </div>
            {faculty.description && (
              <div>
                <p className="text-gray-500">Mô tả:</p>
                <p className="font-medium">{faculty.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm theo tên lớp hoặc khóa..."
          onChange={handleSearchChange}
          className="px-4 py-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <Table 
          columns={columns} 
          dataSource={filteredClasses}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không có lớp nào trong khoa này' }}
        />
      </div>
    </div>
  );
} 