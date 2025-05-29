'use client';

import { Select } from 'antd';

type SemesterOption = {
  label: string;
  value: string;
};

type Props = {
  semesterOptions: SemesterOption[];
  selectedSemester: string;
  onChange: (value: string) => void;
  loading?: boolean;
};

export default function SemesterSelector({ 
  semesterOptions, 
  selectedSemester, 
  onChange, 
  loading = false 
}: Props) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <label className="text-sm font-medium text-gray-700">Chọn học kỳ:</label>
      <Select
        style={{ width: 280 }}
        value={selectedSemester}
        onChange={onChange}
        loading={loading}
        placeholder="Vui lòng chọn học kỳ"
        className="semester-selector"
      >
        <Select.Option value="all" disabled>
          <span className="text-gray-400">-- Chọn học kỳ --</span>
        </Select.Option>
        {semesterOptions.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}
