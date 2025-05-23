'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { Table, Select, Tabs } from 'antd';
import type { TabsProps } from 'antd';

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

interface Faculty {
  id: number;
  name: string;
  faculty_abbr: string;
}

interface ClassInfo {
  id: number;
  name: string;
  faculty_id: number;
}

interface StatData {
  faculty_abbr?: string;
  faculty_name?: string;
  class_name?: string;
  average_score: number;
  student_count: number;
  excellent_count: number;
  good_count: number;
  fair_count: number;
  average_count: number;
  poor_count: number;
}

export default function StudentScoresPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFacultyAbbr, setSelectedFacultyAbbr] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('scores');
  const [facultyStats, setFacultyStats] = useState<StatData[]>([]);
  const [classStats, setClassStats] = useState<StatData[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Get current semester
        const currentSemesterResponse = await api.get('/api/student-scores/current-semester');
        const currentSem = currentSemesterResponse.data.data.semester;

        // Get all semesters
        const semestersResponse = await api.get('/api/student-scores/semesters');
        const allSemesters = semestersResponse.data.data.semesters;

        // Get faculties
        const facultiesResponse = await api.get('/api/faculties');
        const allFaculties = facultiesResponse.data.data.faculties;

        // Get classes
        const classesResponse = await api.get('/api/classes');
        const allClasses = classesResponse.data.data.classes;

        // Set states
        setCurrentSemester(currentSem);
        setSemesters(allSemesters);
        setFaculties(allFaculties);
        setClasses(allClasses);

        // Load scores for current semester
        if (currentSem) {
          await fetchStudentScoresBySemester(currentSem.semester_no, currentSem.academic_year);
          await fetchStats(currentSem.semester_no, currentSem.academic_year);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchStudentScoresBySemester = async (semesterNo: number, academicYear: number) => {
    try {
      const response = await api.get(`/api/student-scores/semester/${semesterNo}/${academicYear}`);
      const studentScores = response.data.data.studentScores;
      setScores(studentScores);
    } catch (error) {
      // Handle error silently
    }
  };

  const fetchStats = async (semesterNo: number, academicYear: number) => {
    try {
      // Get faculty stats
      const facultyStatsResponse = await api.get(`/api/student-scores/stats/faculty/${semesterNo}/${academicYear}`);
      setFacultyStats(facultyStatsResponse.data.data.stats);

      // Get class stats
      const classStatsResponse = await api.get(`/api/student-scores/stats/class/${semesterNo}/${academicYear}`);
      setClassStats(classStatsResponse.data.data.stats);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleSemesterChange = async (value: string) => {
    const [semesterNo, academicYear] = value.split('_').map(Number);
    await fetchStudentScoresBySemester(semesterNo, academicYear);
    await fetchStats(semesterNo, academicYear);
  };

  const handleFacultyChange = (value: string | undefined) => {
    setSelectedFacultyAbbr(value || null);
    setSelectedClassName(null);
  };

  const handleClassChange = (value: string | undefined) => {
    setSelectedClassName(value || null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredScores = useMemo(() => {
    return scores.filter((score) => {
      // Skip records with no Student data
      if (!score.Student) {
        return false;
      }
      
      const matchesSearch = searchTerm === '' || 
        score.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (score.Student.student_name && score.Student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      // Match faculty by abbreviation
      let matchesFaculty = true;
      if (selectedFacultyAbbr !== null) {
        const facultyAbbr = score.Student.Faculty?.faculty_abbr;
        matchesFaculty = facultyAbbr === selectedFacultyAbbr;
      }
      
      // Match class by name
      let matchesClass = true;
      if (selectedClassName !== null) {
        const className = score.Student.Class?.name;
        matchesClass = className === selectedClassName;
      }
      
      const result = matchesSearch && matchesFaculty && matchesClass;
      return result;
    });
  }, [scores, searchTerm, selectedFacultyAbbr, selectedClassName]);

  const filteredClasses = useMemo(() => {
    // If no faculty is selected, show all classes
    // Otherwise, filter classes by the selected faculty
    const selectedFaculty = faculties.find(f => f.faculty_abbr === selectedFacultyAbbr);
    const result = selectedFacultyAbbr === null 
      ? classes 
      : classes.filter(c => c.faculty_id === (selectedFaculty?.id || 0));
    
    return result;
  }, [classes, faculties, selectedFacultyAbbr]);

  const scoreColumns = [
    {
      title: 'Mã sinh viên',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: 'Tên sinh viên',
      key: 'student_name',
      render: (record: StudentScore) => record.Student?.student_name || '',
    },
    {
      title: 'Khoa',
      key: 'faculty',
      render: (record: StudentScore) => record.Student?.Faculty?.faculty_abbr || '',
    },
    {
      title: 'Lớp',
      key: 'class',
      render: (record: StudentScore) => record.Student?.Class?.name || '',
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: StudentScore, b: StudentScore) => a.score - b.score,
    },
    {
      title: 'Tình trạng',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => status === 'none' ? 'Bình thường' : 'Kỷ luật',
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
    }
  ];

  const facultyStatsColumns = [
    {
      title: 'Mã khoa',
      dataIndex: 'faculty_abbr',
      key: 'faculty_abbr',
    },
    {
      title: 'Tên khoa',
      dataIndex: 'faculty_name',
      key: 'faculty_name',
    },
    {
      title: 'Điểm trung bình',
      dataIndex: 'average_score',
      key: 'average_score',
      render: (val: number) => (typeof val === 'number' ? val.toFixed(2) : '0.00'),
    },
    {
      title: 'Số sinh viên',
      dataIndex: 'student_count',
      key: 'student_count',
    },
    {
      title: 'Xuất sắc',
      dataIndex: 'excellent_count',
      key: 'excellent_count',
    },
    {
      title: 'Tốt',
      dataIndex: 'good_count',
      key: 'good_count',
    },
    {
      title: 'Khá',
      dataIndex: 'fair_count',
      key: 'fair_count',
    },
    {
      title: 'Trung bình',
      dataIndex: 'average_count',
      key: 'average_count',
    },
    {
      title: 'Yếu',
      dataIndex: 'poor_count',
      key: 'poor_count',
    },
  ];

  const classStatsColumns = [
    {
      title: 'Mã khoa',
      dataIndex: 'faculty_abbr',
      key: 'faculty_abbr',
    },
    {
      title: 'Lớp',
      dataIndex: 'class_name',
      key: 'class_name',
    },
    {
      title: 'Điểm trung bình',
      dataIndex: 'average_score',
      key: 'average_score',
      render: (val: number) => (typeof val === 'number' ? val.toFixed(2) : '0.00'),
    },
    {
      title: 'Số sinh viên',
      dataIndex: 'student_count',
      key: 'student_count',
    },
    {
      title: 'Xuất sắc',
      dataIndex: 'excellent_count',
      key: 'excellent_count',
    },
    {
      title: 'Tốt',
      dataIndex: 'good_count',
      key: 'good_count',
    },
    {
      title: 'Khá',
      dataIndex: 'fair_count',
      key: 'fair_count',
    },
    {
      title: 'Trung bình',
      dataIndex: 'average_count',
      key: 'average_count',
    },
    {
      title: 'Yếu',
      dataIndex: 'poor_count',
      key: 'poor_count',
    },
  ];

  const items: TabsProps['items'] = [
    {
      key: 'scores',
      label: 'Danh sách điểm sinh viên',
      children: (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên..."
              onChange={handleSearchChange}
              className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
            />
            <Select 
              placeholder="Chọn khoa" 
              allowClear 
              style={{ width: 200 }}
              onChange={(value) => handleFacultyChange(value)}
              className="mx-2"
            >
              {faculties.map((faculty) => (
                <Option key={faculty.faculty_abbr} value={faculty.faculty_abbr}>
                  {faculty.faculty_abbr}
                </Option>
              ))}
            </Select>
            <Select 
              placeholder="Chọn lớp" 
              allowClear 
              style={{ width: 200 }}
              disabled={selectedFacultyAbbr === null}
              value={selectedClassName}
              onChange={(value) => handleClassChange(value)}
              className="mx-2"
            >
              {scores
                .filter(score => score.Student?.Faculty?.faculty_abbr === selectedFacultyAbbr && score.Student?.Class?.name)
                .map(score => score.Student?.Class?.name)
                .filter((name, index, self) => name && self.indexOf(name) === index) 
                .map(className => (
                  <Option key={className} value={className}>
                    {className}
                  </Option>
                ))
              }
            </Select>
          </div>
          <Table 
            dataSource={filteredScores} 
            columns={scoreColumns} 
            rowKey={(record) => `${record.student_id}_${record.semester_no}_${record.academic_year}`}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
    {
      key: 'faculty-stats',
      label: 'Thống kê theo khoa',
      children: (
        <div className="space-y-4">
          <Table 
            dataSource={facultyStats} 
            columns={facultyStatsColumns} 
            rowKey={(record) => record.faculty_abbr || ''}
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'class-stats',
      label: 'Thống kê theo lớp',
      children: (
        <div className="space-y-4">
          <Table 
            dataSource={classStats} 
            columns={classStatsColumns} 
            rowKey={(record) => record.class_name || ''}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý điểm rèn luyện</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <span className="mr-2">Học kỳ:</span>
          <Select 
            defaultValue={currentSemester ? `${currentSemester.semester_no}_${currentSemester.academic_year}` : undefined} 
            style={{ width: 180 }}
            onChange={handleSemesterChange}
          >
            {semesters.map((semester) => (
              <Option key={`${semester.semester_no}_${semester.academic_year}`} value={`${semester.semester_no}_${semester.academic_year}`}>
                {`Học kỳ ${semester.semester_no} (${semester.academic_year}-${semester.academic_year + 1})`}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  );
} 