'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { Select, Tabs, Row, Col, Card } from 'antd';
import type { TabsProps } from 'antd';
import ScoreList from '@/components/studentscore/ScoreList';
import FacultyStats from '@/components/studentscore/FacultyStats';
import ClassStats from '@/components/studentscore/ClassStats';
import CohortStats from '@/components/studentscore/CohortStats';
import PieChart from '@/components/studentscore/PieChart';

const { Option } = Select;

interface Semester {
  semester_no: number;
  academic_year: number;
}

interface Faculty {
  id: number;
  name: string;
  faculty_abbr: string;
}

interface CohortOverview {
  total_students: number;
  average_score: number;
  excellent_good_rate: number;
  poor_count: number;
}

interface FacultyStats {
  faculty_abbr: string;
  faculty_name: string;
  total_students: number;
  average_score: number;
  excellent_percentage: number;
  good_percentage: number;
}

interface ScoreDistribution {
  classification_group: string;
  count: number;
  percentage: number;
}

interface CohortBatch {
  cohort: string;
  total_students: number;
  average_score: number;
  excellent_good_rate: string;
  poor_count: string;
}

interface BatchYear {
  cohort: number;
}

export default function StudentScoresPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [scores, setScores] = useState([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [activeTab, setActiveTab] = useState<string>('scores');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [batchYears, setBatchYears] = useState<BatchYear[]>([]);
  const [cohortOverview, setCohortOverview] = useState<CohortOverview | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[] | null>(null);
  const [facultyStats, setFacultyStats] = useState<FacultyStats[] | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [classStats, setClassStats] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Get all semesters
        const semestersResponse = await api.get('/api/student-scores/semesters');
        const allSemesters = semestersResponse.data.data.semesters;
        setSemesters(allSemesters);

        // Get faculties
        const facultiesResponse = await api.get('/api/faculties');
        const allFaculties = facultiesResponse.data.data.faculties;

        // Get batch years
        const batchYearsResponse = await api.get('/api/student-scores/cohort-years');
        const years = batchYearsResponse.data.data.years;

        // Load stats for all cohorts
        const statsResponse = await api.get('/api/student-scores/stats/cohort/all');
        const batches = statsResponse.data.data.batches;
        
        if (batches && batches.length > 0) {
          // Calculate overall stats
          const totalStudents = batches.reduce((sum: number, b: CohortBatch) => sum + b.total_students, 0);
          const weightedScore = batches.reduce((sum: number, b: CohortBatch) => sum + b.average_score * b.total_students, 0);
          const avgScore = weightedScore / totalStudents;
          const excellentGoodCount = batches.reduce((sum: number, b: CohortBatch) => 
            sum + (b.total_students * Number(b.excellent_good_rate)) / 100, 0);
          
          setCohortOverview({
            total_students: totalStudents,
            average_score: Number(avgScore.toFixed(2)),
            excellent_good_rate: Number(((excellentGoodCount * 100) / totalStudents).toFixed(2)),
            poor_count: batches.reduce((sum: number, b: CohortBatch) => sum + Number(b.poor_count), 0)
          });
        }

        // Set states
        setFaculties(allFaculties);
        setBatchYears(years);

        // Load tất cả sinh viên mặc định
        const scoresResponse = await api.get('/api/student-scores/students');
        setScores(scoresResponse.data.data.studentScores);

      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSemesterChange = async (value: string) => {
    setLoading(true);
    try {
      setSelectedSemester(value);

      if (value === 'all') {
        const response = await api.get('/api/student-scores/students');
        setScores(response.data.data.studentScores);
        setCurrentSemester(null);
      } else {
        const [semesterNo, academicYear] = value.split('_').map(Number);
        const response = await api.get(`/api/student-scores/semester/${semesterNo}/${academicYear}`);
        setScores(response.data.data.studentScores);
        setCurrentSemester({ semester_no: semesterNo, academic_year: academicYear });
      }
    } catch (error) {
      console.error('Error changing semester:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
  };

  const handleYearChange = async (value: string) => {
    setSelectedYear(value);
    try {
      const response = await api.get('/api/student-scores/stats/cohort/all');
      const batches = response.data.data.batches;
      
      if (batches && batches.length > 0) {
        if (value === 'all') {
          // Calculate overall stats for all cohorts
          const totalStudents = batches.reduce((sum: number, b: CohortBatch) => sum + b.total_students, 0);
          const weightedScore = batches.reduce((sum: number, b: CohortBatch) => sum + b.average_score * b.total_students, 0);
          const avgScore = weightedScore / totalStudents;
          const excellentGoodCount = batches.reduce((sum: number, b: CohortBatch) => 
            sum + (b.total_students * Number(b.excellent_good_rate)) / 100, 0);
          
          setCohortOverview({
            total_students: totalStudents,
            average_score: Number(avgScore.toFixed(2)),
            excellent_good_rate: Number(((excellentGoodCount * 100) / totalStudents).toFixed(2)),
            poor_count: batches.reduce((sum: number, b: CohortBatch) => sum + Number(b.poor_count), 0)
          });
        } else {
          // Get stats for specific cohort
          const selectedCohort = batches.find((b: CohortBatch) => b.cohort === value);
          if (selectedCohort) {
            setCohortOverview({
              total_students: selectedCohort.total_students,
              average_score: Number(selectedCohort.average_score),
              excellent_good_rate: Number(selectedCohort.excellent_good_rate),
              poor_count: Number(selectedCohort.poor_count)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading cohort data:', error);
    }
  };

  const getStatsEndpoint = (activeTab: string) => {
    let endpoint = '';

    // Xác định endpoint cơ bản dựa vào tab
    switch (activeTab) {
      case 'faculty':
        endpoint = '/api/student-scores/stats/faculty';
        break;
      case 'class':
        endpoint = '/api/student-scores/stats/class';
        break;
      case 'cohort':
        endpoint = '/api/student-scores/stats/cohort';
        break;
      default:
        endpoint = '/api/student-scores/stats/faculty';
    }

    // Nếu là all thì thêm /all, ngược lại thêm semester params
    if (selectedSemester === 'all') {
      endpoint = `${endpoint}/all`;
      // Thêm faculty param nếu có
      if (selectedFaculty !== 'all' && activeTab === 'class') {
        endpoint += `?facultyId=${selectedFaculty}`;
      }
    } else {
      const [semesterNo, academicYear] = selectedSemester.split('_').map(Number);
      if (activeTab === 'cohort') {
        // For cohort endpoint, always use path parameters
        endpoint = `${endpoint}/${semesterNo}/${academicYear}`;
      } else if (endpoint.endsWith('/all')) {
        // For /all endpoints, add semester params as query parameters
        endpoint += `?semesterNo=${semesterNo}&academicYear=${academicYear}`;
        if (selectedFaculty !== 'all' && activeTab === 'class') {
          endpoint += `&facultyId=${selectedFaculty}`;
        }
      } else {
        // For other endpoints, add semester params as path parameters
        endpoint = `${endpoint}/${semesterNo}/${academicYear}`;
        // Thêm faculty param nếu có
        if (selectedFaculty !== 'all' && activeTab === 'class') {
          endpoint += `?facultyId=${selectedFaculty}`;
        }
      }
    }
    return endpoint;
  };

  const statsItems: TabsProps['items'] = [
    {
      key: 'faculty',
      label: 'Theo khoa',
      children: (
        <>
          <div className="mb-6">
            <span className="mr-2">Khoa:</span>
            <Select
              value={selectedFaculty}
              style={{ width: 180 }}
              onChange={handleFacultyChange}
            >
              <Option key="all" value="all">Tất cả các khoa</Option>
              {faculties.map((faculty) => (
                <Option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </Option>
              ))}
            </Select>
          </div>
          <FacultyStats
            selectedSemester={selectedSemester}
            selectedFaculty={selectedFaculty}
            faculties={faculties}
            statsEndpoint={getStatsEndpoint('faculty')}
          />
        </>
      )
    },
    {
      key: 'class',
      label: 'Theo lớp',
      children: (
        <ClassStats
          selectedSemester={selectedSemester}
          selectedFaculty={selectedFaculty}
          faculties={faculties}
          statsEndpoint={getStatsEndpoint('class')}
        />
      )
    },
    {
      key: 'cohort',
      label: 'Theo khóa',
      children: (
        <>
          <div className="mb-6">
            <span className="mr-2">Khóa:</span>
            <Select
              value={selectedYear}
              style={{ width: 180 }}
              onChange={handleYearChange}
            >
              <Option key="all" value="all">Tất cả khóa</Option>
              {batchYears.map((year) => (
                <Option key={year.cohort} value={year.cohort}>
                  {`Khóa ${year.cohort}`}
                </Option>
              ))}
            </Select>
          </div>

          <CohortStats
            selectedYear={selectedYear}
            selectedSemester={selectedSemester}
            overview={cohortOverview}
            scoreDistribution={scoreDistribution}
          />
        </>
      )
    }
  ];

  const items: TabsProps['items'] = [
    {
      key: 'scores',
      label: 'Danh sách điểm sinh viên',
      children: <ScoreList 
        scores={scores} 
        faculties={faculties} 
        page={currentPage} 
        limit={pageSize}
        selectedSemester={selectedSemester}
      />,
    },
    {
      key: 'stats',
      label: 'Thống kê',
      children: (
        <Tabs defaultActiveKey="faculty" items={statsItems} className="mt-4" />
      ),
    }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(getStatsEndpoint('class'));
        const stats = response.data.data.classes || [];
        setClassStats(stats);
        setSelectedClass('all');
      } catch (error) {
        console.error('Error fetching class stats:', error);
        setClassStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getStatsEndpoint('class')]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý điểm rèn luyện</h1>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <span className="mr-2">Học kỳ:</span>
            <Select
              value={selectedSemester}
              style={{ width: 180 }}
              onChange={handleSemesterChange}
            >
              <Option key="all" value="all">Tất cả học kỳ</Option>
              {semesters.map((semester) => (
                <Option key={`${semester.semester_no}_${semester.academic_year}`} value={`${semester.semester_no}_${semester.academic_year}`}>
                  {`Học kỳ ${semester.semester_no} (${semester.academic_year}-${semester.academic_year + 1})`}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  );
} 