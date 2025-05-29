// Class management components
export { default as StudentManagementTable } from './StudentManagementTable';
export { default as ClassScoreOverview } from './ClassScoreOverview';

// Re-export student components for class-leader use
export {
  ActivityTable,
  ActivityRegistrationTabs,
  ScoreStatistics,
  ScoreCharts,
  ScoreHistoryTable,
  PerformanceAnalysis,
  YearFilter,
  ProfileHeader,
  ProfileDetails,
  ProfileStats,
  EditProfileModal
} from '../student';

// Re-export types for class-leader use
export type {
  StudentScore,
  StudentProfile,
  StudentSummary
} from '../student/types'; 