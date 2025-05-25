'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { Select, Tabs, Row, Col, Card } from 'antd';
import type { TabsProps } from 'antd';
import ScoreList from '../../../../components/studentscore/ScoreList';
import FacultyStats from '../../../../components/studentscore/FacultyStats';
import ClassStats from '../../../../components/studentscore/ClassStats';
import CohortStats from '../../../../components/studentscore/CohortStats';
import PieChart from '../../../../components/studentscore/PieChart';

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
  excellent_percentage: number;
  good_percentage: number;
  fair_percentage: number;
  average_percentage: number;
  poor_percentage: number;
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
  const [batchYears, setBatchYears] = useState<{academic_year: number}[]>([]);
  const [cohortOverview, setCohortOverview] = useState<CohortOverview | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[] | null>(null);
  const [facultyStats, setFacultyStats] = useState<FacultyStats[] | null>(null);

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

        // Load overview for all cohorts
        const overviewResponse = await api.get('/api/student-scores/stats/cohort/overview');
        setCohortOverview(overviewResponse.data.data.overview);
        setScoreDistribution(overviewResponse.data.data.scoreDistribution);
        setFacultyStats(overviewResponse.data.data.facultyStats);

        // Set states
        setFaculties(allFaculties);
        setBatchYears(years);

        // Load tất cả điểm mặc định
        const scoresResponse = await api.get('/api/student-scores');
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
        const response = await api.get('/api/student-scores');
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
      if (value === 'all') {
        // Load overview for all cohorts
        const overviewResponse = await api.get('/api/student-scores/stats/cohort/overview');
        setCohortOverview(overviewResponse.data.data.overview);
        setScoreDistribution(overviewResponse.data.data.scoreDistribution);
        setFacultyStats(overviewResponse.data.data.facultyStats);
      } else {
        // Load overview for specific cohort
        const overviewResponse = await api.get(`/api/student-scores/stats/cohort/${value}/overview`);
        setCohortOverview(overviewResponse.data.data.overview);
        setScoreDistribution(overviewResponse.data.data.scoreDistribution);
        setFacultyStats(overviewResponse.data.data.facultyStats);
      }
    } catch (error) {
      console.error('Error loading cohort data:', error);
    }
  };

  const getStatsEndpoint = (activeTab: string) => {
    if (selectedSemester === 'all') {
      switch (activeTab) {
        case 'faculty':
          return '/api/student-scores/stats/faculty/all';
        case 'class':
          return '/api/student-scores/stats/class/all';
        case 'cohort':
          return selectedYear === 'all' 
            ? '/api/student-scores/stats/cohort/all'
            : `/api/student-scores/stats/cohort/${selectedYear}/classes`;
        default:
          return '/api/student-scores/stats/faculty/all';
      }
    }
    const [semesterNo, academicYear] = selectedSemester.split('_').map(Number);
    switch (activeTab) {
      case 'faculty':
        return `/api/student-scores/stats/faculty/${semesterNo}/${academicYear}`;
      case 'class':
        return `/api/student-scores/stats/class/${semesterNo}/${academicYear}`;
      case 'cohort':
        return selectedYear === 'all'
          ? `/api/student-scores/stats/cohort/${semesterNo}/${academicYear}`
          : `/api/student-scores/stats/cohort/${selectedYear}/classes`;
      default:
        return `/api/student-scores/stats/faculty/${semesterNo}/${academicYear}`;
    }
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
          selectedFaculty="all"
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
                <Option key={year.academic_year} value={year.academic_year}>
                  {`Khóa ${year.academic_year}`}
                </Option>
              ))}
            </Select>
          </div>

          <CohortStats 
            selectedYear={selectedYear}
            statsEndpoint={getStatsEndpoint('cohort')}
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
      children: <ScoreList scores={scores} faculties={faculties} />,
    },
    {
      key: 'stats',
      label: 'Thống kê',
      children: (
        <Tabs defaultActiveKey="faculty" items={statsItems} className="mt-4" />
      ),
    }
  ];

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