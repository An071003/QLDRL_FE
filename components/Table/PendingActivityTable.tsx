"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Activity } from "@/types/activity";
import { Campaign } from "@/types/campaign";
import { CheckCircle, XCircle } from "lucide-react";
import { Tooltip } from "antd";
import Loading from "../Loading";
import ConfirmDeleteModal from "../Modal/ConfirmDeleteModal";

interface PendingActivityTableProps {
  currentcampaigns: Campaign[];
  activities: Activity[];
  onApproveActivity: (id: number) => Promise<void>;
  onRejectActivity: (id: number) => Promise<void>;
}

export default function PendingActivityTable({
  currentcampaigns,
  activities,
  onApproveActivity,
  onRejectActivity,
}: PendingActivityTableProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await onApproveActivity(id);
      toast.success("Phê duyệt hoạt động thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi phê duyệt hoạt động");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    setActivityToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!activityToDelete) return;
    
    try {
      setLoading(true);
      await onRejectActivity(activityToDelete);
      toast.success("Từ chối hoạt động thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi từ chối hoạt động");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setActivityToDelete(null);
    }
  };

  const handleCancelReject = () => {
    setIsDeleteModalOpen(false);
    setActivityToDelete(null);
  };

  if (loading) {
    return <Loading />;
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500">Không có hoạt động nào đang chờ phê duyệt</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hoạt động</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phong trào</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity, index) => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Tooltip title={activity.name} placement="topLeft">
                    <div className="max-w-[200px] overflow-hidden text-ellipsis">
                      {activity.name}
                    </div>
                  </Tooltip>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <Tooltip 
                    title={currentcampaigns.find(campaign => campaign.id === activity.campaign_id)?.name || 
                    activity.campaign_name || 
                    "Không xác định"} 
                    placement="topLeft"
                  >
                    <div className="max-w-[200px] overflow-hidden text-ellipsis">
                      {currentcampaigns.find(campaign => campaign.id === activity.campaign_id)?.name || 
                      activity.campaign_name || 
                      "Không xác định"}
                    </div>
                  </Tooltip>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={activity.point < 0 ? "text-red-600" : "text-green-600"}>
                    {activity.point}
                    <span className="ml-2 text-xs">
                      {activity.point < 0 ? '(Trừ điểm)' : '(Cộng điểm)'}
                    </span>
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {activity.Creator?.user_name || "Không xác định"}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {activity.created_at 
                    ? new Date(activity.created_at).toLocaleDateString('vi-VN') 
                    : "Không xác định"}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                  <div className="flex justify-center gap-2">
                    <Tooltip title="Phê duyệt" placement="top">
                      <button 
                        onClick={() => handleApprove(activity.id)} 
                        className="cursor-pointer text-green-600 hover:text-green-900"
                      >
                        <CheckCircle size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Từ chối" placement="top">
                      <button 
                        onClick={() => handleReject(activity.id)} 
                        className="cursor-pointer text-red-600 hover:text-red-900"
                      >
                        <XCircle size={20} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Xác nhận từ chối hoạt động"
        message="Bạn có chắc chắn muốn từ chối hoạt động này? Hoạt động sẽ bị xóa vĩnh viễn và không thể khôi phục."
        onConfirm={handleConfirmReject}
        onCancel={handleCancelReject}
      />
    </>
  );
} 