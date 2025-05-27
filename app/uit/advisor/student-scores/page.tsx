'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { Select, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import AdvisorScoreList from '@/components/studentscore/AdvisorScoreList';
import AdvisorClassStats from '@/components/studentscore/AdvisorClassStats';

const { Option } = Select;

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  status: 'none' | 'disciplined';
  classification: string;
  Student?: {
    student_name: string;
    faculty_id?: number;
    class_id?: number;
    Faculty?: {
      id?: number;
      name: string;
      faculty_abbr: string;
    };
    Class?: {
      id?: number;
      name: string;
    };
  };
}

interface Semester {
  semester_no: number;
  academic_year: number;
}

interface Class {
  id: number;
  name: string;
}

export default function AdvisorStudentScoresPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [allScores, setAllScores] = useState<StudentScore[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeTab, setActiveTab] = useState<string>('scores');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [advisorClasses, setAdvisorClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [advisorId, setAdvisorId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    async function getCurrentUser() {
      try {
        const response = await fetch('/api/auth/current-user');
        const data = await response.json();

        if (data.success) {
          setCurrentUserId(data.data.user.id);
        } else {
          console.error("Failed to get user:", data.error);
        }
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    }

    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAdvisorData = async () => {
      if (!currentUserId) return;
      console.log("Fetching advisor data...");
      try {
        // Get advisor details with the user ID
        const advisorRes = await api.get(`/api/advisors/user/${currentUserId}`);
        
        if (advisorRes.data?.advisor) {
          setAdvisorId(advisorRes.data.advisor.id);
          if (advisorRes.data.advisor.Classes && Array.isArray(advisorRes.data.advisor.Classes)) {
            setAdvisorClasses(advisorRes.data.advisor.Classes);
          }
        }
      } catch (error) {
        console.error('Error fetching advisor data:', error);
      }
    };

    fetchAdvisorData();
  }, [currentUserId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!advisorId) return;

      try {
        setLoading(true);

        // Get all semesters
        const semestersResponse = await api.get('/api/student-scores/semesters');
        const allSemesters = semestersResponse.data.data.semesters;
        setSemesters(allSemesters);

        // Load all students from advisor's classes using new endpoint
        const scoresResponse = await api.get(`/api/student-scores/advisor/${advisorId}/students`);
        setAllScores(scoresResponse.data.data.studentScores);

      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [advisorId]);

  const handleSemesterChange = async (value: string) => {
    setLoading(true);
    try {
      setSelectedSemester(value);

      if (value === 'all') {
        const response = await api.get(`/api/student-scores/advisor/${advisorId}/students`);
        setAllScores(response.data.data.studentScores);
      } else {
        const [semesterNo, academicYear] = value.split('_').map(Number);
        const response = await api.get(`/api/student-scores/advisor/${advisorId}/semester/${semesterNo}/${academicYear}`);
        setAllScores(response.data.data.studentScores);
      }
    } catch (error) {
      console.error('Error changing semester:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const filteredScores = allScores.filter((score) => {
    if (!score.Student) return false;

    const matchesSearch = searchTerm === '' ||
      score.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (score.Student.student_name && score.Student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesClass = selectedClass === 'all' || score.Student.Class?.name === selectedClass;

    return matchesSearch && matchesClass;
  });

  const items: TabsProps['items'] = [
    {
      key: 'scores',
      label: 'Danh sách điểm',
      children: (
        <div className="space-y-4">
          <div className="flex gap-4 mb-4 items-center">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên sinh viên..."
              onChange={(e) => handleSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
            />
            <Select
              style={{ width: 200 }}
              placeholder="Chọn lớp"
              onChange={handleClassChange}
              value={selectedClass}
            >
              <Option value="all">Tất cả lớp</Option>
              {advisorClasses.map((cls) => (
                <Option key={cls.name} value={cls.name}>
                  {cls.name}
                </Option>
              ))}
            </Select>
          </div>
          <AdvisorScoreList scores={filteredScores} />
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Thống kê theo lớp',
      children: (
        <AdvisorClassStats
          selectedSemester={selectedSemester}
          advisorId={advisorId}
          advisorClasses={advisorClasses}
        />
      ),
    },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý điểm rèn luyện</h1>
      <div className="flex gap-4">
        <Select
          style={{ width: 200 }}
          placeholder="Chọn học kỳ"
          onChange={handleSemesterChange}
          value={selectedSemester}
        >
          <Option value="all">Tất cả học kỳ</Option>
          {semesters.map((semester) => (
            <Option
              key={`${semester.semester_no}_${semester.academic_year}`}
              value={`${semester.semester_no}_${semester.academic_year}`}
            >
              {`Học kỳ ${semester.semester_no} (${semester.academic_year}-${semester.academic_year + 1
                })`}
            </Option>
          ))}
        </Select>
      </div>
      <Tabs items={items} activeKey={activeTab} onChange={(key) => setActiveTab(key)} />
    </div>
  );
} 