import { Card, Select } from "antd";

const { Option } = Select;

interface YearFilterProps {
  selectedYear: string;
  years: number[];
  onChange: (value: string) => void;
}

export default function YearFilter({ selectedYear, years, onChange }: YearFilterProps) {
  return (
    <Card className="mb-6">
      <div className="flex items-center gap-4">
        <span className="font-medium">Năm học:</span>
        <Select
          value={selectedYear}
          onChange={onChange}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả năm học</Option>
          {years.map(year => (
            <Option key={year} value={year.toString()}>
              {year}-{year + 1}
            </Option>
          ))}
        </Select>
      </div>
    </Card>
  );
} 