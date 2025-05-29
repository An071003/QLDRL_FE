'use client';

import { useState, useEffect } from 'react';
import { Alert, Spin } from 'antd';
import { ClassleaderLayout } from '@/components/layout/class-leader';
import {
  ScoreStatistics,
  ScoreCharts,
  ScoreHistoryTable,
  PerformanceAnalysis,
  YearFilter
} from '@/components/student';
import api from '@/lib/api';
import { toast } from 'sonner';

interface StudentScore {
  student_id: string;
  semester_no: number;
  academic_year: number;
  score: number;
  classification: string;
  status: 'none' | 'disciplined';
}

interface StudentProfile {
  student_id: string;
  student_name: string;
  classification?: string;
  sumscore: number;
  Faculty?: {
    name: string;
    faculty_abbr: string;
  };
  Class?: {
    name: string;
  };
}

interface StudentSummary {
  sumscore: number;
  classification: string;
}

export default function ClassLeaderGradesPage() {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<StudentScore[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    fetchData();
    initializeChart();
  }, []);

  const initializeChart = async () => {
    try {
      const ChartJS = await import('chart.js');
      ChartJS.Chart.register(
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.BarElement,
        ChartJS.LineElement,
        ChartJS.PointElement,
        ChartJS.ArcElement,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.Legend
      );
      setChartReady(true);
    } catch (error) {
      console.error('Error initializing Chart.js:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch student profile
      const profileResponse = await api.get('/api/students/me');
      if (profileResponse.data?.status === "success" && profileResponse.data?.data?.student) {
        setProfile(profileResponse.data.data.student);
      } else {
        // Fallback demo data
        setProfile({
          student_id: "21520002",
          student_name: "Nguyễn Văn B - Lớp trưởng",
          classification: "Xuất sắc",
          sumscore: 92.5,
          Faculty: { name: "Công nghệ thông tin", faculty_abbr: "CNTT" },
          Class: { name: "21CNTT1" }
        });
        setIsDemoMode(true);
      }

      // Fetch student summary
      const summaryResponse = await api.get('/api/students/me/summary');
      if (summaryResponse.data?.status === "success" && summaryResponse.data?.data) {
        setSummary(summaryResponse.data.data);
      } else {
        setSummary({ sumscore: 92.5, classification: "Xuất sắc" });
      }

      // Fetch student scores
      const scoresResponse = await api.get('/api/students/me/scores');
      if (scoresResponse.data?.status === "success" && scoresResponse.data?.data?.scores) {
        setScores(scoresResponse.data.data.scores);
      } else {
        // Fallback demo scores
        const demoScores: StudentScore[] = [
          { student_id: "21520002", semester_no: 1, academic_year: 2023, score: 95.0, classification: "Xuất sắc", status: 'none' },
          { student_id: "21520002", semester_no: 2, academic_year: 2023, score: 88.5, classification: "Giỏi", status: 'none' },
          { student_id: "21520002", semester_no: 1, academic_year: 2024, score: 94.0, classification: "Xuất sắc", status: 'none' },
          { student_id: "21520002", semester_no: 2, academic_year: 2024, score: 92.5, classification: "Xuất sắc", status: 'none' },
        ];
        setScores(demoScores);
        setIsDemoMode(true);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      // Use demo data on error
      setProfile({
        student_id: "21520002",
        student_name: "Nguyễn Văn B - Lớp trưởng",
        classification: "Xuất sắc",
        sumscore: 92.5,
        Faculty: { name: "Công nghệ thông tin", faculty_abbr: "CNTT" },
        Class: { name: "21CNTT1" }
      });
      setSummary({ sumscore: 92.5, classification: "Xuất sắc" });
      const demoScores: StudentScore[] = [
        { student_id: "21520002", semester_no: 1, academic_year: 2023, score: 95.0, classification: "Xuất sắc", status: 'none' },
        { student_id: "21520002", semester_no: 2, academic_year: 2023, score: 88.5, classification: "Giỏi", status: 'none' },
        { student_id: "21520002", semester_no: 1, academic_year: 2024, score: 94.0, classification: "Xuất sắc", status: 'none' },
        { student_id: "21520002", semester_no: 2, academic_year: 2024, score: 92.5, classification: "Xuất sắc", status: 'none' },
      ];
      setScores(demoScores);
      setIsDemoMode(true);
      toast.error("Đang sử dụng dữ liệu demo - Lỗi kết nối API");
    } finally {
      setLoading(false);
    }
  };

  // Filter scores by year
  const filteredScores = selectedYear === 'all' 
    ? scores 
    : scores.filter(score => score.academic_year.toString() === selectedYear);

  // Sort scores by year and semester correctly (ascending order: HK1 before HK2)
  const sortedScores = [...filteredScores].sort((a, b) => {
    if (a.academic_year !== b.academic_year) {
      return a.academic_year - b.academic_year;
    }
    return a.semester_no - b.semester_no;
  });

  // Get unique years
  const years = [...new Set(scores.map(score => score.academic_year))].sort((a, b) => b - a);

  // Statistics calculations
  const totalSemesters = filteredScores.length;

  if (loading) {
    return (
      <ClassleaderLayout>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </ClassleaderLayout>
    );
  }

  const currentScore = summary?.sumscore || profile?.sumscore || 0;
  const currentClassification = summary?.classification || profile?.classification || 'Chưa xếp loại';

  return (
    <ClassleaderLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bảng điểm rèn luyện - Lớp trưởng</h1>
          <p className="text-gray-600">Xem chi tiết điểm rèn luyện cá nhân của bạn</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <Alert
            message="Chế độ Demo"
            description="Bạn đang xem dữ liệu demo. Vui lòng đăng nhập với tài khoản lớp trưởng để xem thông tin thực."
            type="warning"
            showIcon
            className="mb-6"
            closable
          />
        )}

        {/* Score Statistics */}
        <ScoreStatistics
          currentScore={currentScore}
          currentClassification={currentClassification}
          totalSemesters={totalSemesters}
        />

        {/* Filter */}
        <YearFilter
          selectedYear={selectedYear}
          years={years}
          onChange={setSelectedYear}
        />

        {/* Charts and Table */}
        <ScoreCharts scores={filteredScores} chartReady={chartReady} />

        {/* Score History Table */}
        <div className="mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Lịch sử điểm rèn luyện</h3>
            <ScoreHistoryTable scores={sortedScores} />
          </div>
        </div>

        {/* Performance Analysis */}
        <PerformanceAnalysis scores={sortedScores} />
      </div>
    </ClassleaderLayout>
  );
} 