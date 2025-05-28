'use client';

import { useEffect, useState, useMemo } from 'react';
import { Spin, Typography, Alert, Empty } from 'antd';
import { useStudentData } from '@/lib/contexts/StudentDataContext';
import SemesterSelector from '@/components/student.studentscore/SemesterSelector';
import CriteriaAccordion from '@/components/student.studentscore/CriteriaAccordion';
import { ScoreData } from '@/types/studentscorepage';
import { StudentLayout } from '@/components/layout/student';

export default function StudentScorePage() {
  const { campaigns, loading: dataLoading, getScoreDetail } = useStudentData();
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  // Tạo semester options từ campaigns (giống như DataContext)
  const semesterOptions = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    // Lấy unique semesters từ campaigns
    const uniqueSemesters = new Map<string, { semester_no: number; academic_year: number }>();
    
    campaigns.forEach(campaign => {
      const key = `${campaign.semester_no}_${campaign.academic_year}`;
      if (!uniqueSemesters.has(key)) {
        uniqueSemesters.set(key, {
          semester_no: campaign.semester_no,
          academic_year: campaign.academic_year
        });
      }
    });

    // Chuyển đổi thành format cho UI
    const options = Array.from(uniqueSemesters.values()).map((sem) => {
      const nextYear = sem.academic_year + 1;
      const semesterLabel = sem.semester_no === 3
        ? `Học kỳ Hè (${sem.academic_year} - ${nextYear})`
        : `Học kỳ ${sem.semester_no} (${sem.academic_year} - ${nextYear})`;
      
      return {
        label: semesterLabel,
        value: `${sem.semester_no}_${sem.academic_year}`
      };
    });

    // Sắp xếp theo năm học và học kỳ (mới nhất trước)
    options.sort((a, b) => {
      const [semesterA, yearA] = a.value.split('_').map(Number);
      const [semesterB, yearB] = b.value.split('_').map(Number);

      if (yearA !== yearB) return yearB - yearA; // Năm mới nhất trước
      return semesterB - semesterA; // Học kỳ cao hơn trước
    });

    return options;
  }, [campaigns]);

  // Tự động chọn học kỳ mới nhất khi có dữ liệu
  useEffect(() => {
    if (semesterOptions.length > 0 && selectedSemester === "all") {
      setSelectedSemester(semesterOptions[0].value);
    }
  }, [semesterOptions, selectedSemester]);

  useEffect(() => {
    const fetchScoreData = async () => {
      if (selectedSemester === "all") {
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [semester_no, academic_year] = selectedSemester.split("_");
        console.log('Fetching score data for:', { semester_no, academic_year });
        const scoreData = await getScoreDetail(semester_no, academic_year);
        console.log('Score data received:', scoreData);

        if (scoreData) {
          setData({
            criteria: scoreData.criteria,
            sumscore: scoreData.sumscore
          });
          console.log('Data set:', {
            criteria: scoreData.criteria,
            sumscore: scoreData.sumscore
          });
        } else {
          setData(null);
          setError('Không có dữ liệu điểm cho học kỳ này.');
        }
      } catch (err: unknown) {
        console.error('Error fetching score data:', err);
        const errorMessage = err && typeof err === 'object' && 'response' in err &&
          err.response && typeof err.response === 'object' && 'status' in err.response &&
          err.response.status === 404
          ? 'Không có dữ liệu điểm cho học kỳ này.'
          : 'Không thể tải dữ liệu điểm. Vui lòng thử lại sau.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchScoreData();
  }, [selectedSemester, getScoreDetail]);

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-6">
        <Typography.Title level={3} className="text-center mb-6">
          Bảng điểm rèn luyện
        </Typography.Title>

        {error && (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => setError(null)}
          />
        )}

        <SemesterSelector
          semesterOptions={semesterOptions}
          selectedSemester={selectedSemester}
          onChange={setSelectedSemester}
          loading={dataLoading}
        />

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spin size="large" />
          </div>
        ) : selectedSemester === "all" ? (
          <Empty
            description="Vui lòng chọn học kỳ để xem điểm rèn luyện"
            className="mt-10"
          />
        ) : !data ? (
          <Empty
            description="Không có dữ liệu điểm rèn luyện cho học kỳ này"
            className="mt-10"
          />
        ) : (
          <>
            <CriteriaAccordion criteria={data.criteria} />
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <span className="text-lg font-medium text-gray-700">Tổng điểm rèn luyện: </span>
                <span className="text-2xl font-bold text-blue-600">{data.sumscore}</span>
                <span className="text-sm text-gray-500 ml-2">/ 100 điểm</span>
              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
