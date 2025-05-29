# Student Components

Thư viện components dành cho các trang sinh viên trong hệ thống QLDRL.

## Cấu trúc Components

### Activity Components
- **ActivityTable**: Hiển thị bảng hoạt động với row selection
- **ActivityRegistrationTabs**: Tabs quản lý đăng ký và hủy hoạt động

### Score Components
- **ScoreStatistics**: Thống kê tổng quan về điểm (điểm hiện tại, xếp loại, số học kỳ)
- **ScoreCharts**: Các biểu đồ phân tích điểm (đường, cột, phân bố)
- **ScoreHistoryTable**: Bảng lịch sử điểm theo học kỳ
- **PerformanceAnalysis**: Phân tích xu hướng và hiệu suất
- **YearFilter**: Filter lọc theo năm học

### Profile Components
- **ProfileHeader**: Header với avatar và thông tin cơ bản
- **ProfileDetails**: Chi tiết thông tin sinh viên
- **ProfileStats**: Thống kê điểm trong profile
- **EditProfileModal**: Modal chỉnh sửa thông tin cá nhân

## Sử dụng

```tsx
import {
  ActivityRegistrationTabs,
  ScoreStatistics,
  ScoreCharts,
  ProfileHeader,
  // ... other components
} from '@/components/student';

// Sử dụng trong component
<ActivityRegistrationTabs
  availableActivities={availableActivities}
  registeredActivities={registeredActivities}
  // ... props khác
/>
```

## Types & Utilities

```tsx
import {
  StudentScore,
  StudentProfile,
  StudentSummary,
  getClassificationColor,
  getScoreColor,
  getStatusColor,
  getStatusText
} from '@/components/student';
```

## Lợi ích

1. **Tái sử dụng**: Components có thể dùng lại ở nhiều nơi
2. **Dễ bảo trì**: Logic tập trung, dễ sửa đổi
3. **Type Safety**: TypeScript interfaces rõ ràng
4. **Consistent UI**: Giao diện nhất quán
5. **Testing**: Dễ test từng component riêng lẻ

## Cập nhật tương lai

- Thêm component cho notifications
- Component cho dashboard widgets
- Responsive components cho mobile
- Theme customization support 