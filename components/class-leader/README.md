# Class Leader Components

Thư viện components dành cho các trang lớp trưởng trong hệ thống QLDRL.

## Cấu trúc Components

### Class Management Components
- **StudentManagementTable**: Bảng quản lý sinh viên với tìm kiếm, sắp xếp và phân trang
- **ClassScoreOverview**: Tổng quan điểm lớp với thống kê và biểu đồ phân bố

### Re-exported Student Components
Các components từ student được tái sử dụng cho lớp trưởng:
- **ActivityRegistrationTabs**: Đăng ký và hủy hoạt động
- **ScoreStatistics**, **ScoreCharts**, **ScoreHistoryTable**: Thống kê điểm cá nhân
- **ProfileHeader**, **ProfileDetails**, **ProfileStats**: Thông tin cá nhân
- **EditProfileModal**: Chỉnh sửa thông tin

## Các trang đã được tạo

### `/uit/class-leader/profile`
- Trang thông tin cá nhân của lớp trưởng
- Sử dụng các components từ student với demo data phù hợp

### `/uit/class-leader/grades`
- **Bảng điểm cá nhân của lớp trưởng** (tương tự student/grades)
- Hiển thị điểm rèn luyện cá nhân, biểu đồ, lịch sử điểm theo học kỳ
- Phân tích xu hướng điểm và xếp loại cá nhân

### `/uit/class-leader/final-score`
- **Bảng điểm tổng kết cá nhân của lớp trưởng** (tương tự student/final-score)
- Hiển thị điểm tổng kết cá nhân, thống kê tổng quan
- Phân tích kết quả học tập qua các học kỳ

### `/uit/class-leader/class`
- Quản lý sinh viên trong lớp
- Sử dụng `StudentManagementTable` để xem danh sách sinh viên
- Tính năng tìm kiếm và xem chi tiết sinh viên

### `/uit/class-leader/assignActivities`
- Đăng ký hoạt động cho lớp trưởng
- Sử dụng `ActivityRegistrationTabs` từ student components

## Sử dụng

```tsx
import {
  StudentManagementTable,
  ClassScoreOverview,
  ActivityRegistrationTabs,
  ScoreStatistics,
  ProfileHeader,
  // ... other components
} from '@/components/class-leader';

// Sử dụng trong component quản lý lớp
<ClassScoreOverview 
  stats={classStats} 
  className="21CNTT1" 
/>

<StudentManagementTable
  students={students}
  loading={loading}
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  onViewStudent={handleViewStudent}
/>

// Sử dụng trong các trang điểm cá nhân
<ScoreStatistics
  currentScore={currentScore}
  currentClassification={currentClassification}
  totalSemesters={totalSemesters}
/>
```

## Phân biệt chức năng

### Trang cá nhân (giống Student)
- **`/profile`**: Thông tin cá nhân lớp trưởng
- **`/grades`**: Điểm rèn luyện cá nhân của lớp trưởng
- **`/final-score`**: Điểm tổng kết cá nhân của lớp trưởng
- **`/assignActivities`**: Đăng ký hoạt động cho bản thân

### Trang quản lý lớp
- **`/class`**: Quản lý danh sách sinh viên trong lớp
- **`/activities`**: Quản lý hoạt động của lớp

## Lợi ích

1. **Tái sử dụng**: Kế thừa tối đa từ student components cho các trang cá nhân
2. **Mở rộng**: Thêm các tính năng quản lý lớp đặc thù cho lớp trưởng
3. **Nhất quán**: Giao diện và trải nghiệm người dùng thống nhất giữa student và class-leader
4. **Dễ bảo trì**: Components tập trung, dễ sửa đổi

## Cập nhật tương lai

- Thêm tính năng thông báo cho sinh viên trong lớp
- Export Excel cho danh sách sinh viên
- Dashboard tổng quan cho lớp trưởng
- Tích hợp với hệ thống notifications 