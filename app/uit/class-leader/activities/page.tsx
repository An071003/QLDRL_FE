'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { useRouter } from 'next/navigation';
import { Tabs, Tab } from "@/components/Tabs";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import { jwtVerify } from 'jose';
import ActivityForm from "@/components/form/ActivityForm";
import ActivityImport from "@/components/Import/ActivityImport";
import { Tooltip } from "antd";
import { ClassleaderLayout } from "@/components/layout/class-leader";

export default function ClassleaderActivityManagement() {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [createdPendingActivities, setCreatedPendingActivities] = useState<Activity[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<string | null>('point');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedSemester, setSelectedSemester] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<string>("approved");
    const [activeComponent, setActiveComponent] = useState<"form" | "import" | "table">("table");
    const itemsPerPage = 10; const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function verifyToken() {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1];

            if (token) {
                try {
                    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET as string);
                    const { payload } = await jwtVerify(token, secret);
                    setCurrentUserId(payload.id as number);
                } catch (error) {
                    console.error("Error verifying token:", error);
                }
            }
        }

        verifyToken();
    }, []);

    useEffect(() => {
        loadData();
    }, [currentUserId]);

    const loadData = async () => {
        setLoading(true);
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

            const createdPendingRes = await api.get("/api/activities/created-pending");
            let pendingData;

            if (createdPendingRes.data.data.activities) {
                pendingData = createdPendingRes.data.data.activities;
            } else {
                pendingData = createdPendingRes.data.data || [];
            }

            setCreatedPendingActivities(pendingData);
        } catch (error) {
            toast.error("Không thể tải dữ liệu");
            console.error(error);
        } finally {
            setLoading(false);
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
                    case 'semester':
                        const campaignASem = campaigns.find(c => c.id === a.campaign_id);
                        const campaignBSem = campaigns.find(c => c.id === b.campaign_id);
                        valueA = campaignASem ? `${campaignASem.semester_no}_${campaignASem.academic_year}` : '';
                        valueB = campaignBSem ? `${campaignBSem.semester_no}_${campaignBSem.academic_year}` : '';
                        break;
                    case 'point':
                        valueA = a.point || 0;
                        valueB = b.point || 0;
                        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
                    case 'number_students':
                        valueA = a.number_students || 0;
                        valueB = b.number_students || 0;
                        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
                    case 'max_participants':
                        valueA = a.max_participants || 0;
                        valueB = b.max_participants || 0;
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
            : sortedAndFilteredPendingActivities.length / itemsPerPage
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

    if (loading) {
        return (
            <Loading />
        );
    }

    const renderMainContent = () => {
        switch (activeComponent) {
            case "form":
                return <ActivityForm currentcampaigns={campaigns} onActivityCreated={handleCreateActivity} />;
            case "import":
                return <ActivityImport onActivitiesImported={handleActivitiesImported} currentcampaigns={campaigns} />;
            default:
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

                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <Tab value="approved" title="Đã phê duyệt">
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
                                                        onClick={() => handleSort('semester')}
                                                    >
                                                        Học kỳ {sortField === 'semester' && (sortDirection === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                    <th
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                                        onClick={() => handleSort('point')}
                                                    >
                                                        Điểm {sortField === 'point' && (sortDirection === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                    <th
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer min-w-[120px]"
                                                        onClick={() => handleSort('number_students')}
                                                    >
                                                        SL đăng ký {sortField === 'number_students' && (sortDirection === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                    <th
                                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer min-w-[120px]"
                                                        onClick={() => handleSort('max_participants')}
                                                    >
                                                        SL tối đa {sortField === 'max_participants' && (sortDirection === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                    <th
                                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                                                    >
                                                        Thời gian đăng ký
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
                                                                <Tooltip title={activity.name} placement="topLeft">
                                                                    <div className="max-w-[200px] overflow-hidden text-ellipsis">
                                                                        {activity.name}
                                                                    </div>
                                                                </Tooltip>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <Tooltip
                                                                    title={campaigns.find(campaign => campaign.id === activity.campaign_id)?.name ||
                                                                        activity.campaign_name ||
                                                                        "Không xác định"}
                                                                    placement="topLeft"
                                                                >
                                                                    <div className="max-w-[200px] overflow-hidden text-ellipsis">
                                                                        {campaigns.find(campaign => campaign.id === activity.campaign_id)?.name ||
                                                                            activity.campaign_name ||
                                                                            "Không xác định"}
                                                                    </div>
                                                                </Tooltip>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                {campaign ? `Học kỳ ${campaign.semester_no} - ${campaign.academic_year}` : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap min-w-[80px]">{activity.point}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center min-w-[120px]">{activity.number_students || 0}</td>
                                                            <td className="px-4 py-3 text-center whitespace-nowrap min-w-[120px]">
                                                                {activity.max_participants || "Không giới hạn"}
                                                            </td>
                                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                {activity.registration_start && activity.registration_end
                                                                    ? `${new Date(activity.registration_start).toLocaleDateString('vi-VN')} - ${new Date(activity.registration_end).toLocaleDateString('vi-VN')}`
                                                                    : "Không có thông tin"}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold ${activity.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                <button
                                                                    onClick={() => router.push(`/uit/class-leader/activities/${activity.id}`)}
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
                                </div>
                            </Tab>
                            <Tab value="pending" title="Chờ phê duyệt">
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
                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer min-w-[120px]"
                                                        onClick={() => handleSort('number_students')}
                                                    >
                                                        SL đăng ký {sortField === 'number_students' && (sortDirection === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                    <th
                                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer min-w-[120px]"
                                                        onClick={() => handleSort('max_participants')}
                                                    >
                                                        SL tối đa
                                                    </th>
                                                    <th
                                                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                                                    >
                                                        Thời gian đăng ký
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
                                                            <td className="px-4 py-3 whitespace-nowrap text-center min-w-[120px]">{activity.number_students || 0}</td>
                                                            <td className="px-4 py-3 text-center whitespace-nowrap min-w-[120px]">
                                                                {activity.max_participants || "Không giới hạn"}
                                                            </td>
                                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                {activity.registration_start && activity.registration_end
                                                                    ? `${new Date(activity.registration_start).toLocaleDateString('vi-VN')} - ${new Date(activity.registration_end).toLocaleDateString('vi-VN')}`
                                                                    : "Không có thông tin"}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className="px-2 py-1 rounded inline-flex text-xs leading-5 font-semibold bg-yellow-100 text-yellow-800">
                                                                    Chờ phê duyệt
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                <button
                                                                    onClick={() => router.push(`/uit/class-leader/activities/${activity.id}`)}
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

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                <button
                                                    onClick={() => goToPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    Trước
                                                </button>
                                                <button
                                                    onClick={() => goToPage(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    Sau
                                                </button>
                                            </div>
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{" "}
                                                        <span className="font-medium">
                                                            {Math.min(currentPage * itemsPerPage, (activeTab === "approved" ? sortedAndFilteredActivities.length : sortedAndFilteredPendingActivities.length))}
                                                        </span>{" "}
                                                        trong tổng số{" "}
                                                        <span className="font-medium">{activeTab === "approved" ? sortedAndFilteredActivities.length : sortedAndFilteredPendingActivities.length}</span> kết quả
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                        <button
                                                            onClick={() => goToPage(1)}
                                                            disabled={currentPage === 1}
                                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium ${currentPage === 1
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            Đầu
                                                        </button>
                                                        <button
                                                            onClick={() => goToPage(currentPage - 1)}
                                                            disabled={currentPage === 1}
                                                            className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${currentPage === 1
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            &lt;
                                                        </button>
                                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                            const pageToShow = totalPages <= 5
                                                                ? i + 1
                                                                : Math.min(Math.max(currentPage - 2 + i, 1), totalPages);
                                                            return (
                                                                <button
                                                                    key={pageToShow}
                                                                    onClick={() => goToPage(pageToShow)}
                                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${currentPage === pageToShow
                                                                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                                                >
                                                                    {pageToShow}
                                                                </button>
                                                            );
                                                        })}
                                                        <button
                                                            onClick={() => goToPage(currentPage + 1)}
                                                            disabled={currentPage === totalPages}
                                                            className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${currentPage === totalPages
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            &gt;
                                                        </button>
                                                        <button
                                                            onClick={() => goToPage(totalPages)}
                                                            disabled={currentPage === totalPages}
                                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium ${currentPage === totalPages
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            Cuối
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Tab>
                        </Tabs>
                    </>
                );
        }
    };

    return (
        <ClassleaderLayout>
            <div>
                <h1 className="text-3xl font-bold mb-6">Quản lý hoạt động</h1>
                {activeComponent !== "table" && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setActiveComponent("table")}
                            className="px-4 py-2 cursor-pointer bg-rose-400 text-white rounded hover:bg-rose-700"
                        >
                            Quay về danh sách
                        </button>
                    </div>
                )}
                {renderMainContent()}
            </div>
        </ClassleaderLayout>
    );
} 