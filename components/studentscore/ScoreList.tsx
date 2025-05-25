import { Table, Select } from 'antd';
import { useState } from 'react';
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

interface Faculty {
  id: number;
  name: string;
  faculty_abbr: string;
}

interface ScoreListProps {
  scores: StudentScore[];
  faculties: Faculty[];
}

export default function ScoreList({ scores, faculties }: ScoreListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFacultyAbbr, setSelectedFacultyAbbr] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);

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

  const filteredScores = scores.filter((score) => {
    if (!score.Student) return false;
    
    const matchesSearch = searchTerm === '' || 
      score.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (score.Student.student_name && score.Student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    let matchesFaculty = true;
    if (selectedFacultyAbbr !== null) {
      const facultyAbbr = score.Student.Faculty?.faculty_abbr;
      matchesFaculty = facultyAbbr === selectedFacultyAbbr;
    }
    
    let matchesClass = true;
    if (selectedClassName !== null) {
      const className = score.Student.Class?.name;
      matchesClass = className === selectedClassName;
    }
    
    return matchesSearch && matchesFaculty && matchesClass;
  });

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

  return (
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
  );
} 