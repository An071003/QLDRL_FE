'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { ClassLeaderLayout } from '@/components/layout/classleader';
import { Table, Tag, Button, Input, Modal, Checkbox, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Tabs, Tab } from "@/components/Tabs";
import ActivityForm from "@/components/form/ActivityForm";
import ActivityImport from "@/components/Import/ActivityImport";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";

interface Student {
  student_id: string;
  student_name: string;
  phone?: string;
  status?: 'none' | 'disciplined';
  classification?: string;
  sumscore?: number;
}

interface ClassData {
  id: number;
  name: string;
  faculty_id: number;
  cohort: string;
  class_leader_id?: string | null;
  faculty_name?: string;
}

export default function ClassManagementPage() {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);
  
  // States for user and class data
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [currentClassLeaderId, setCurrentClassLeaderId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // States for student search and selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // States for activity management
  const [activities, setActivities] = useState<Activity[]>([]);
  const [createdPendingActivities, setCreatedPendingActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sortField, setSortField] = useState<string | null>('point');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("students");
  const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
  const itemsPerPage = 10;
  
  // States for activity registration modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Effect to get current user and class info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user info
        const userRes = await api.get('/api/auth/me');
        const userData = userRes.data.data.user;
        
        if (userData.Role?.name !== 'classleader') {
          toast.error('Bạn không phải là lớp trưởng');
          router.push('/uit/student');
          return;
        }

        // Assuming the student object is inside the user object
        const studentId = userData.Student?.student_id;
        setCurrentClassLeaderId(studentId);
        setCurrentUserId(userData.id);
        
        if (!studentId) {
          toast.error('Không tìm thấy thông tin sinh viên');
          return;
        }

        // Get student info to find out class_id
        const studentRes = await api.get(`/api/students/${studentId}`);
        const studentData = studentRes.data.data.student;
        
        if (!studentData?.class_id) {
          toast.error('Không tìm thấy lớp của lớp trưởng');
          return;
        }

        // Get class info and students
        const classRes = await api.get(`/api/classes/${studentData.class_id}`);
        const classData = classRes.data.data.class;
        setClassData(classData);

        if (classData.faculty_id) {
          try {
            const facultyRes = await api.get(`/api/faculties/${classData.faculty_id}`);
            if (facultyRes.data?.data?.faculty) {
              setClassData({
                ...classData,
                faculty_name: facultyRes.data.data.faculty.name
              });
            }
          } catch (error) {
            console.error('Error fetching faculty info:', error);
          }
        }

        // Get students in the class
        const studentsRes = await api.get(`/api/classes/${studentData.class_id}/students`);
        setStudents(studentsRes.data.data.students || []);
        
        // Load activities
        await loadData();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Không thể tải dữ liệu lớp');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);
  
  const loadData = async () => {
    try {
      const campaignsRes = await api.get("/api/campaigns");
      const campaignsData = campaignsRes.data.data.campaigns || campaignsRes.data.data || [];
      setCampaigns(campaignsData);
      
      // Get all activities
      const activitiesRes = await api.get("/api/activities");
      let allActivities;

      if (activitiesRes.data.data.activities) {
        allActivities = activitiesRes.data.data.activities;
      } else {
        allActivities = activitiesRes.data.data || [];
      }

      const approved = allActivities.filter((activity: Activity) => activity.approver_id !== null);
      setActivities(approved);
      
      // Get activities created by current user that are pending approval
      const createdPendingRes = await api.get("/api/activities/created-pending");
      let pendingData;
      
      if (createdPendingRes.data.data.activities) {
        pendingData = createdPendingRes.data.data.activities;
      } else {
        pendingData = createdPendingRes.data.data || [];
      }
      
      setCreatedPendingActivities(pendingData);
    } catch (error) {
      toast.error("Không thể tải dữ liệu hoạt động");
      console.error(error);
    }
  };

  const handleCreateActivity = async (newActivity: {
    name: string;
    point: number;
    campaign_id: number;
    max_participants?: number;
    registration_start?: string;
    registration_end?: string;
  }) => {
    const campaign = campaigns.find(c => c.id === newActivity.campaign_id);
    if (campaign && newActivity.point > (campaign?.max_score || 0)) {
      toast.error(`Điểm hoạt động không được lớn hơn điểm tối đa (${campaign.max_score}) của phong trào.`);
      return { success: false };
    }
    
    if (!newActivity.registration_start || !newActivity.registration_end) {
      toast.error("Ngày bắt đầu và kết thúc đăng ký là bắt buộc.");
      return { success: false };
    }
    
    if (newActivity.max_participants === undefined) {
      newActivity.max_participants = 0; 
    }
    
    try {
      await api.post("/api/activities", newActivity);
      await loadData();
      setActiveComponent("table");
      toast.success("Thêm hoạt động thành công 🎉");
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error("Thêm hoạt động thất bại ❌");
      return { success: false };
    }
  };

  const handleActivitiesImported = async (importedActivities: {
    name: string;
    point: number;
    campaign_id: number;
    max_participants: number;
    registration_start: string;
    registration_end: string;
    status?: string;
  }[]) => {
    try {
      await api.post("/api/activities/import", importedActivities);
      await loadData();
      setActiveComponent("table");
      toast.success("Import hoạt động thành công 🚀");
      return { success: true };
    } catch (error) {
      console.error(error);
      toast.error("Import hoạt động thất bại ❌");
      return { success: false };
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const semesterOptions = useMemo(() => {
    const options = new Set<string>();
    campaigns.forEach(campaign => {
      options.add(`${campaign.semester_no}_${campaign.academic_year}`);
    });

    return Array.from(options).map(option => {
      const [semester_no, academic_year] = option.split('_');
      return {
        value: option,
        label: `Học kỳ ${semester_no} - ${academic_year}`
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, [campaigns]);

  const sortedAndFilteredActivities = useMemo(() => {
    // Filter by search term and semester
    const filtered = activities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((activity) => {
        if (selectedSemester === "all") return true;

        // Find campaign for the activity
        const campaign = campaigns.find(c => c.id === activity.campaign_id);
        if (!campaign) return false;

        // Check if campaign matches selected semester
        const [semester_no, academic_year] = selectedSemester.split("_");
        return campaign.semester_no?.toString() === semester_no &&
          campaign.academic_year?.toString() === academic_year;
      });

    // Apply sorting
    if (sortField) {
      return [...filtered].sort((a, b) => {
        let valueA: any;
        let valueB: any;

        switch (sortField) {
          case 'id':
            valueA = a.id;
            valueB = b.id;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'name':
            valueA = a.name || '';
            valueB = b.name || '';
            break;
          case 'campaign':
            const campaignA = campaigns.find(c => c.id === a.campaign_id);
            const campaignB = campaigns.find(c => c.id === b.campaign_id);
            valueA = campaignA?.name || '';
            valueB = campaignB?.name || '';
            break;
          case 'point':
            valueA = a.point || 0;
            valueB = b.point || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'number_students':
            valueA = a.number_students || 0;
            valueB = b.number_students || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          default:
            return 0;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        return 0;
      });
    }

    return filtered;
  }, [activities, campaigns, searchTerm, selectedSemester, sortField, sortDirection]);

  // Create a similar function for pending activities
  const sortedAndFilteredPendingActivities = useMemo(() => {
    // Filter by search term and semester
    const filtered = createdPendingActivities
      .filter((activity) => activity.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((activity) => {
        if (selectedSemester === "all") return true;

        // Find campaign for the activity
        const campaign = campaigns.find(c => c.id === activity.campaign_id);
        if (!campaign) return false;

        // Check if campaign matches selected semester
        const [semester_no, academic_year] = selectedSemester.split("_");
        return campaign.semester_no?.toString() === semester_no &&
          campaign.academic_year?.toString() === academic_year;
      });

    // Apply sorting
    if (sortField) {
      return [...filtered].sort((a, b) => {
        let valueA: string | number;
        let valueB: string | number;

        switch (sortField) {
          case 'id':
            valueA = a.id;
            valueB = b.id;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'name':
            valueA = a.name || '';
            valueB = b.name || '';
            break;
          case 'campaign':
            const campaignA = campaigns.find(c => c.id === a.campaign_id);
            const campaignB = campaigns.find(c => c.id === b.campaign_id);
            valueA = campaignA?.name || '';
            valueB = campaignB?.name || '';
            break;
          case 'point':
            valueA = a.point || 0;
            valueB = b.point || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          case 'number_students':
            valueA = a.number_students || 0;
            valueB = b.number_students || 0;
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
          default:
            return 0;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        return 0;
      });
    }

    return filtered;
  }, [createdPendingActivities, campaigns, searchTerm, selectedSemester, sortField, sortDirection]);

  const totalPages = Math.ceil(
    activeTab === "approved" 
      ? sortedAndFilteredActivities.length / itemsPerPage
      : activeTab === "pending"
        ? sortedAndFilteredPendingActivities.length / itemsPerPage
        : filteredStudents.length / itemsPerPage
  );
  
  const paginatedActivities = activeTab === "approved"
    ? sortedAndFilteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : sortedAndFilteredPendingActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Function to open modal and get available activities
  const handleOpenActivityModal = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sinh viên');
      return;
    }

    setLoadingActivities(true);
    try {
      // Lấy tất cả hoạt động
      const activitiesRes = await api.get('/api/activities');
      const allActivities = activitiesRes.data.data.activities || activitiesRes.data.data || [];
      
      // Lọc hoạt động đang diễn ra và đã được phê duyệt
      let availableActs = allActivities.filter((act: Activity) => 
        act.approver_id !== null && act.status === 'ongoing'
      );
      
      // Lấy danh sách hoạt động đã đăng ký của mỗi sinh viên
      const registeredActivitiesPromises = selectedStudents.map(studentId => 
        api.get(`/api/student-activities/student/${studentId}`)
      );
      
      const registeredActivitiesResponses = await Promise.all(registeredActivitiesPromises);
      
      // Tạo một Set chứa ID của tất cả các hoạt động mà ít nhất một sinh viên đã đăng ký
      const registeredActivityIds = new Set<number>();
      
      registeredActivitiesResponses.forEach(response => {
        const activities = response.data.data || [];
        activities.forEach((activity: Activity) => {
          registeredActivityIds.add(activity.id);
        });
      });
      
      // Lọc ra các hoạt động mà không có sinh viên nào đã đăng ký
      availableActs = availableActs.filter((activity: Activity) => !registeredActivityIds.has(activity.id));
      
      console.log(`Hiển thị ${availableActs.length}/${allActivities.length} hoạt động có thể đăng ký`);
      
      setAvailableActivities(availableActs);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải danh sách hoạt động');
    } finally {
      setLoadingActivities(false);
    }
  };

  // Function to register students for an activity
  const handleRegisterStudents = async () => {
    if (!selectedActivity) {
      toast.error('Vui lòng chọn một hoạt động');
      return;
    }

    try {
      await api.post(`/api/student-activities/${selectedActivity}/students`, {
        studentIds: selectedStudents
      });
      
      toast.success('Đăng ký hoạt động thành công');
      setIsModalVisible(false);
      setSelectedStudents([]);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error registering students:', error);
      toast.error('Đăng ký hoạt động thất bại');
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Table columns for students
  const columns: ColumnsType<Student> = [
    {
      title: () => (
        <div className="flex items-center">
          <Checkbox 
            checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
            indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
            onChange={handleSelectAllStudents}
          />
          <span className="ml-2">MSSV</span>
        </div>
      ),
      dataIndex: 'student_id',
      key: 'student_id',
      render: (text: string, record: Student) => (
        <div className="flex items-center">
          <Checkbox 
            checked={selectedStudents.includes(record.student_id)}
            onChange={() => handleSelectStudent(record.student_id)}
          />
          <span className="ml-2">{text}</span>
        </div>
      )
    },
    {
      title: 'Họ và tên',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (text: string, record: Student) => (
        <div className="flex items-center">
          {record.student_id === currentClassLeaderId && (
            <Tag color="yellow" className="mr-2">
              Lớp trưởng
            </Tag>
          )}
          <span>{text}</span>
        </div>
      )
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || 'N/A'
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'sumscore',
      key: 'sumscore',
      sorter: (a: Student, b: Student) => (a.sumscore || 0) - (b.sumscore || 0),
      render: (text: number) => text || 0
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      key: 'classification',
      render: (text: string) => text || 'Chưa xếp loại'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'disciplined' ? 'red' : 'green'}>
          {status === 'disciplined' ? 'Vi phạm kỷ luật' : 'Bình thường'}
        </Tag>
      )
    }
  ];
  
  // Handle checkbox selection for students
  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Handle select all students
  const handleSelectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.student_id));
    }
  };

  // Render activities and pending activities content
  const renderActivitiesContent = () => {
    if (activeComponent === "form") {
      return <ActivityForm currentcampaigns={campaigns} onActivityCreated={handleCreateActivity} />;
    } else if (activeComponent === "import") {
      return <ActivityImport onActivitiesImported={handleActivitiesImported} currentcampaigns={campaigns} />;
    }
    
    return (
      <>
        <div ref={tableRef} className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm theo tên hoạt động..."
            className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
          />
          <select
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/4"
          >
            <option value="all">Tất cả học kỳ</option>
            {semesterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setActiveComponent("form")}
              className="px-4 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Thêm hoạt động
            </button>
            <button
              onClick={() => setActiveComponent("import")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Import hoạt động
            </button>
          </div>
        </div>
        
        <div className="mt-4 bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    STT
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Tên hoạt động {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('campaign')}
                  >
                    Phong trào {sortField === 'campaign' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Học kỳ
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('point')}
                  >
                    Điểm {sortField === 'point' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('number_students')}
                  >
                    Số sinh viên {sortField === 'number_students' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Trạng thái
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedActivities.map((activity, index) => {
                  const campaign = campaigns.find(c => c.id === activity.campaign_id);
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="max-w-xs truncate" title={activity.name}>{activity.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {campaign?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {campaign ? `Học kỳ ${campaign.semester_no} - ${campaign.academic_year}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{activity.point}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{activity.number_students || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold ${activity.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/uit/classleader/activities/${activity.id}`)}
                          className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Trước
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, sortedAndFilteredActivities.length)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{sortedAndFilteredActivities.length}</span> hoạt động
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    &laquo;
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderPendingActivitiesContent = () => {
    return (
      <>
        <div className="mt-4 bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    STT
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Tên hoạt động {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('campaign')}
                  >
                    Phong trào {sortField === 'campaign' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('point')}
                  >
                    Điểm {sortField === 'point' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Ngày tạo
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredPendingActivities.length > 0 ? (
                  sortedAndFilteredPendingActivities.map((activity, index) => {
                    const campaign = campaigns.find(c => c.id === activity.campaign_id);
                    return (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="max-w-xs truncate" title={activity.name}>{activity.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {campaign?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{activity.point}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Chờ phê duyệt
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-gray-500 mb-4">Không có hoạt động nào chờ phê duyệt</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  if (loading) return <Loading />;

  return (
    <ClassLeaderLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Quản lý lớp {classData?.name}</h1>
        
        {/* Class info card */}
        {classData && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500">Tên lớp:</p>
                <p className="font-medium">{classData.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Khóa:</p>
                <p className="font-medium">{classData.cohort}</p>
              </div>
              <div>
                <p className="text-gray-500">Khoa:</p>
                <p className="font-medium">{classData.faculty_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tab value="students" title="Sinh viên">
            {/* Student list */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Danh sách sinh viên</h2>
                <div className="flex items-center space-x-4">
                  <Input.Search
                    placeholder="Tìm kiếm sinh viên..."
                    allowClear
                    onChange={handleSearchChange}
                    style={{ width: 300 }}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleOpenActivityModal}
                    disabled={selectedStudents.length === 0}
                  >
                    Đăng ký hoạt động
                  </Button>
                </div>
              </div>
              
              {students.length > 0 ? (
                <Table 
                  columns={columns} 
                  dataSource={filteredStudents}
                  rowKey="student_id"
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <Empty description="Không có sinh viên nào trong lớp" />
              )}
            </div>
          </Tab>

          <Tab value="approved" title="Hoạt động đã phê duyệt">
            {renderActivitiesContent()}
          </Tab>

          <Tab value="pending" title="Hoạt động chờ duyệt">
            {renderPendingActivitiesContent()}
          </Tab>
        </Tabs>
        
        {/* Activity registration modal */}
        <Modal
          title="Đăng ký hoạt động cho sinh viên"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Hủy
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleRegisterStudents}
              disabled={!selectedActivity}
            >
              Đăng ký
            </Button>
          ]}
        >
          <div className="mb-4">
            <p className="mb-2">Sinh viên đã chọn: {selectedStudents.length}</p>
            <ul className="max-h-40 overflow-y-auto p-2 border rounded">
              {selectedStudents.map(id => {
                const student = students.find(s => s.student_id === id);
                return (
                  <li key={id}>
                    {student?.student_name} ({id})
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div>
            <p className="mb-2">Chọn hoạt động:</p>
            {loadingActivities ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : availableActivities.length > 0 ? (
              <div className="max-h-60 overflow-y-auto p-2 border rounded">
                {availableActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className={`p-2 mb-2 border rounded cursor-pointer ${selectedActivity === activity.id ? 'bg-blue-50 border-blue-500' : ''}`}
                    onClick={() => setSelectedActivity(activity.id)}
                  >
                    <div className="font-medium">{activity.name}</div>
                    <div className="text-sm text-gray-600">
                      <span>Phong trào: {activity.Campaign?.name || 'N/A'}</span>
                      <span className="ml-4">Điểm: {activity.point}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="Không có hoạt động nào khả dụng" />
            )}
          </div>
        </Modal>
      </div>
    </ClassLeaderLayout>
  );
}
