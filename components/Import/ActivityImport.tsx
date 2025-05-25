"use client";

import { useState, useRef } from "react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { UploadCloud, Download, Trash, RefreshCw, Plus, SquarePen } from "lucide-react";
import { Tooltip } from "antd";
import Loading from "../Loading";
import { Campaign } from "@/types/campaign";

type ActivityImport = {
  campaign_id: number;
  name: string;
  point: number;
  max_participants: number;
  registration_start: string;
  registration_end: string;
  status: "ongoing" | "expired";
  row_number?: number;
  error?: string;
  // Display only fields (not sent to backend)
  campaign_name?: string;
};

interface ActivityImportProps {
  onActivitiesImported: (activities: ActivityImport[]) => Promise<{ success: boolean }>;
  currentcampaigns: Campaign[];
}

export default function ActivityImport({ onActivitiesImported, currentcampaigns }: ActivityImportProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewActivities, setPreviewActivities] = useState<ActivityImport[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<{ [key: string]: boolean }>({});
  const [fileKey, setFileKey] = useState<string>(Date.now().toString());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [originalActivityBeforeEdit, setOriginalActivityBeforeEdit] = useState<ActivityImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateActivity = (activity: ActivityImport) => {
    const nameError = !activity.name || activity.name.trim() === '';
    const campaignIdError = isNaN(activity.campaign_id) || activity.campaign_id <= 0;
    const pointError = isNaN(activity.point);
    const maxParticipantsError = isNaN(activity.max_participants) || activity.max_participants < 0;
    const registrationStartError = !activity.registration_start;
    const registrationEndError = !activity.registration_end;
    const dateOrderError = new Date(activity.registration_start) > new Date(activity.registration_end);

    // Check if positive points exceed campaign max_score
    let pointExceedsCampaignError = false;
    if (activity.point > 0 && !pointError && !campaignIdError) {
      const campaign = currentcampaigns.find(c => c.id === activity.campaign_id);
      if (campaign && activity.point > campaign.max_score) {
        pointExceedsCampaignError = true;
      }
    }

    return {
      nameError,
      campaignIdError,
      pointError,
      maxParticipantsError,
      registrationStartError,
      registrationEndError,
      dateOrderError,
      pointExceedsCampaignError
    };
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const processExcelFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const activities: ActivityImport[] = [];
    let skippedRows = 0;
    let invalidCampaigns = new Set<string>();

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      if (workbook.worksheets.length === 0) {
        toast.error('File Excel không có dữ liệu. Vui lòng kiểm tra lại file.');
        setLoading(false);
        return;
      }

      const worksheet = workbook.worksheets[0];

      if (worksheet.rowCount <= 1) {
        toast.error('File Excel không có dữ liệu hoạt động. Hãy đảm bảo file có dữ liệu và đúng định dạng.');
        setLoading(false);
        return;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const name = row.getCell(1).value?.toString().trim() || "";
        const point = Number(row.getCell(2).value) || 0;

        // Try to match campaign name with campaigns list
        let campaign_id = 0;
        let campaign_name = "";
        const campaignNameOrId = row.getCell(3).value?.toString().trim() || "";

        if (campaignNameOrId) {
          // First try to match by name
          const matchedCampaign = currentcampaigns.find(c =>
            c.name.toLowerCase() === campaignNameOrId.toLowerCase());

          if (matchedCampaign) {
            campaign_id = matchedCampaign.id;
            campaign_name = matchedCampaign.name;
          } else {
            // If name doesn't match, try to treat it as ID
            const idNum = Number(campaignNameOrId);
            if (!isNaN(idNum)) {
              const campaignById = currentcampaigns.find(c => c.id === idNum);
              if (campaignById) {
                campaign_id = campaignById.id;
                campaign_name = campaignById.name;
              }
            }
            if (!campaign_id) {
              invalidCampaigns.add(campaignNameOrId);
            }
          }
        }

        const max_participants = Number(row.getCell(4).value) || 0;

        // Handle dates - attempt to parse Excel dates
        let registration_start = '';
        let registration_end = '';

        // Try to parse cell 5 (registration_start) as date
        const startCell = row.getCell(5);
        if (startCell.value instanceof Date) {
          registration_start = startCell.value.toISOString().split('T')[0];
        } else if (startCell.value) {
          // Try to parse string as date
          const date = new Date(String(startCell.value));
          if (!isNaN(date.getTime())) {
            registration_start = date.toISOString().split('T')[0];
          }
        }

        // Try to parse cell 6 (registration_end) as date
        const endCell = row.getCell(6);
        if (endCell.value instanceof Date) {
          registration_end = endCell.value.toISOString().split('T')[0];
        } else if (endCell.value) {
          // Try to parse string as date
          const date = new Date(String(endCell.value));
          if (!isNaN(date.getTime())) {
            registration_end = date.toISOString().split('T')[0];
          }
        }

        // Parse status from cell 7, convert "Đã hết hạn" to "expired" and "Đang diễn ra" to "ongoing"
        const statusText = row.getCell(7).value?.toString().toLowerCase().trim() || "";
        const status = statusText === "đã hết hạn" || statusText === "expired" ? "expired" : "ongoing";

        // Add all rows, even if they have missing or invalid data
        activities.push({
          name,
          point,
          campaign_id,
          campaign_name,
          max_participants,
          registration_start,
          registration_end,
          status,
          row_number: rowNumber,
          error: !name ? "Thiếu tên hoạt động" :
                !campaign_id ? "Phong trào không hợp lệ hoặc không tồn tại" :
                !registration_start ? "Thiếu ngày bắt đầu" :
                !registration_end ? "Thiếu ngày kết thúc" : undefined
        });

        if (!name || !campaign_id || !registration_start || !registration_end) {
          skippedRows++;
        }
      });

      if (activities.length === 0) {
        toast.error('Không tìm thấy dữ liệu hoạt động trong file.');
        setLoading(false);
        return;
      }

      setPreviewActivities(activities);
      setShowErrors(true);

      if (skippedRows > 0 || invalidCampaigns.size > 0) {
        let errorMessage = '';
        if (skippedRows > 0) {
          errorMessage += `Có ${skippedRows} hoạt động thiếu thông tin bắt buộc. `;
        }
        if (invalidCampaigns.size > 0) {
          errorMessage += `Phong trào không tồn tại: ${Array.from(invalidCampaigns).join(', ')}`;
        }
        toast.warning(errorMessage);
      } else {
        toast.success(`Đã tải lên ${activities.length} hoạt động từ file Excel.`);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('Lỗi khi đọc file Excel. Hãy đảm bảo file không bị hỏng và đúng định dạng .xlsx.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processExcelFile(file);
    resetFileInput();
  };

  const resetFileInput = () => {
    setFileKey(Date.now().toString());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReselect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddRow = () => {
    // Get tomorrow as default start date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get next week as default end date
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Default to first campaign if available
    const defaultCampaign = currentcampaigns.length > 0 ? currentcampaigns[0] : null;

    setPreviewActivities(prev => [
      ...prev,
      {
        name: '',
        point: 0,
        campaign_id: defaultCampaign?.id || 0,
        campaign_name: defaultCampaign?.name || '',
        max_participants: 30,
        registration_start: tomorrow.toISOString().split('T')[0],
        registration_end: nextWeek.toISOString().split('T')[0],
        status: 'ongoing',
        row_number: prev.length > 0 ? Math.max(...prev.map(a => a.row_number || 0)) + 1 : 2
      }
    ]);

    setEditingIndex(previewActivities.length);
    setEditErrors({});
  };

  const handleActivityChange = (index: number, key: keyof ActivityImport, value: string | number) => {
    setPreviewActivities(prev => {
      const updated = [...prev];

      if (key === 'point' || key === 'max_participants') {
        updated[index][key] = Number(value) as never;
      } else if (key === 'campaign_id') {
        const campaignId = Number(value);
        updated[index][key] = campaignId as never;

        // Update the campaign name for display
        const campaign = currentcampaigns.find(c => c.id === campaignId);
        if (campaign) {
          updated[index]['campaign_name'] = campaign.name as never;
        }
      } else {
        updated[index][key] = value as never;
      }

      return updated;
    });

    setEditErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleDeleteRow = (index: number) => {
    setPreviewActivities(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditRow = (index: number) => {
    setOriginalActivityBeforeEdit(JSON.parse(JSON.stringify(previewActivities[index])));
    setEditingIndex(index);
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    if (editingIndex !== null && originalActivityBeforeEdit) {
      setPreviewActivities(prev => {
        const updated = [...prev];
        updated[editingIndex] = originalActivityBeforeEdit;
        return updated;
      });
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalActivityBeforeEdit(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const activity = previewActivities[editingIndex];
    const { nameError, campaignIdError, pointError, maxParticipantsError, registrationStartError, registrationEndError, dateOrderError, pointExceedsCampaignError } = validateActivity(activity);

    if (nameError || campaignIdError || pointError || maxParticipantsError || registrationStartError || registrationEndError || dateOrderError || pointExceedsCampaignError) {
      setEditErrors({
        name: nameError,
        campaign_id: campaignIdError,
        point: pointError || pointExceedsCampaignError,
        max_participants: maxParticipantsError,
        registration_start: registrationStartError || dateOrderError,
        registration_end: registrationEndError || dateOrderError
      });

      if (pointExceedsCampaignError) {
        const campaign = currentcampaigns.find(c => c.id === activity.campaign_id);
        toast.error(`Điểm hoạt động không được lớn hơn điểm tối đa (${campaign?.max_score}) của phong trào.`);
      }

      return;
    }

    setEditingIndex(null);
    setEditErrors({});
    setOriginalActivityBeforeEdit(null);
  };

  const handleImport = async () => {
    setShowErrors(true);

    const invalidActivities = previewActivities.map((activity, index) => {
      const validation = validateActivity(activity);
      const hasError = validation.nameError || validation.campaignIdError || validation.pointError ||
        validation.maxParticipantsError || validation.registrationStartError ||
        validation.registrationEndError || validation.dateOrderError || validation.pointExceedsCampaignError;

      return { activity, index, hasError, validation };
    }).filter(item => item.hasError);

    // Check for point exceeds campaign max_score errors specifically
    const pointExceedsCampaignErrors = invalidActivities.filter(item => item.validation.pointExceedsCampaignError);

    if (pointExceedsCampaignErrors.length > 0) {
      toast.error("Import thất bại. Vui lòng kiểm tra điểm hoạt động không vượt quá điểm tối đa của phong trào.");
      return;
    }

    if (invalidActivities.length > 0) {
      toast.error("Import thất bại. Vui lòng kiểm tra lại dữ liệu.");
      return;
    }

    if (previewActivities.length === 0) {
      toast.error("Không có dữ liệu để import");
      return;
    }

    setImporting(true);
    try {
      // Create a clean version of activities without the display-only fields
      const activitiesToImport = previewActivities.map(({ campaign_name, ...rest }) => rest);

      const result = await onActivitiesImported(activitiesToImport);
      if (result.success) {
        setPreviewActivities([]);
        setShowErrors(false);
        setLastUpdated("");
        resetFileInput();
        toast.success("Import hoạt động thành công!");
      } else {
        toast.error("Toàn bộ hoạt động đã tồn tại");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Có lỗi xảy ra khi import.");
    } finally {
      setImporting(false);
    }
  };

  // Function to generate and download a sample Excel template
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Hoạt Động Template');

      // Add headers
      worksheet.columns = [
        { header: 'Tên hoạt động', key: 'name', width: 30 },
        { header: 'Điểm (dương/âm)', key: 'point', width: 15 },
        { header: 'Tên phong trào', key: 'campaign_name', width: 25 },
        { header: 'Số lượng tham gia tối đa', key: 'max_participants', width: 20 },
        { header: 'Ngày bắt đầu đăng ký', key: 'registration_start', width: 20 },
        { header: 'Ngày kết thúc đăng ký', key: 'registration_end', width: 20 },
        { header: 'Trạng thái (Đang diễn ra/Đã kết thúc)', key: 'status', width: 25 },
      ];

      // Get tomorrow as example start date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get next week as example end date
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Add some sample data
      worksheet.addRow({
        name: 'Hoạt động tình nguyện',
        campaign_name: currentcampaigns.length > 0 ? currentcampaigns[0].name : 'Phong trào 1',
        point: 10,
        max_participants: 30,
        registration_start: tomorrow,
        registration_end: nextWeek,
        status: 'ongoing',
      });

      worksheet.addRow({
        name: 'Vắng họp',
        campaign_name: currentcampaigns.length > 0 ? currentcampaigns[0].name : 'Phong trào 1',
        point: -5,
        max_participants: 50,
        registration_start: tomorrow,
        registration_end: nextWeek,
        status: 'expired',
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };

      // Format date cells
      worksheet.getColumn('registration_start').numFmt = 'yyyy-mm-dd';
      worksheet.getColumn('registration_end').numFmt = 'yyyy-mm-dd';

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Create blob and download
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activity_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Tải xuống mẫu thành công!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Có lỗi khi tạo file mẫu.');
    }
  };

  // Add this helper function to truncate text
  const truncateText = (text: string | undefined, maxLength: number = 30) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) return <Loading />;

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-2">Import hoạt động từ file Excel</p>
        <input
          ref={fileInputRef}
          key={fileKey}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleReselect}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1"
            disabled={loading}
          >
            <UploadCloud size={16} />
            <span>{previewActivities.length > 0 ? "Chọn file khác" : "Chọn File"}</span>
          </button>
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <Download size={18} />
            Tải mẫu Excel
          </button>
        </div>
        {lastUpdated && (
          <p className="mt-2 text-sm text-gray-600">
            Dữ liệu được cập nhật lúc: {lastUpdated}
          </p>
        )}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {previewActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6 overflow-x-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold">Xem trước danh sách hoạt động</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddRow}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                title="Thêm hàng mới"
              >
                <Plus size={16} />
                <span>Thêm Hàng</span>
              </button>
              <button
                onClick={handleReselect}
                className="text-blue-600 flex items-center gap-1 hover:text-blue-800"
                title="Chọn lại file từ máy tính để xem phiên bản mới nhất"
              >
                <RefreshCw size={16} />
                <span>Chọn lại file</span>
              </button>
            </div>
          </div>

          <div className="mb-4 p-4 bg-blue-50 text-sm border-b">
            <p className="mb-2 font-semibold">Lưu ý về định dạng dữ liệu:</p>
            <ul className="list-disc pl-4">
              <li><strong>Tên hoạt động:</strong> Tên mô tả hoạt động</li>
              <li><strong>Điểm:</strong> Số điểm của hoạt động (số dương cho điểm cộng, số âm cho điểm trừ)</li>
              <li><strong>Phong trào:</strong> Tên phong trào đã tồn tại trong hệ thống</li>
              <li><strong>Số lượng tham gia tối đa:</strong> Số lượng người tham gia tối đa (phải là số không âm)</li>
              <li><strong>Ngày đăng ký:</strong> Ngày bắt đầu đăng ký phải trước ngày kết thúc</li>
            </ul>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-20">Tên hoạt động</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-20">Phong trào</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-20">Điểm</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL tối đa</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày bắt đầu</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày kết thúc</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewActivities.map((activity, index) => {
                const { nameError, campaignIdError, pointError, maxParticipantsError, registrationStartError, registrationEndError, dateOrderError, pointExceedsCampaignError } = validateActivity(activity);
                const hasError = nameError || campaignIdError || pointError || maxParticipantsError || registrationStartError || registrationEndError || dateOrderError || pointExceedsCampaignError;
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className={`px-2 py-4 ${showErrors && nameError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            value={activity.name || ''}
                            onChange={(e) => handleActivityChange(index, 'name', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && nameError) || editErrors.name ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && nameError) || editErrors.name) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng nhập tên hoạt động</p>
                          )}
                        </>
                      ) : (
                        <Tooltip title={activity.name || "-"} placement="topLeft">
                          <span className={nameError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                            {truncateText(activity.name, 30)}
                          </span>
                        </Tooltip>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${showErrors && campaignIdError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <select
                            value={activity.campaign_id}
                            onChange={(e) => handleActivityChange(index, 'campaign_id', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && campaignIdError) || editErrors.campaign_id ? 'border-red-600 bg-red-50' : ''}`}
                          >
                            <option value="">-- Chọn phong trào --</option>
                            {currentcampaigns.map(campaign => (
                              <option key={campaign.id} value={campaign.id}>{campaign.name} (Tối đa: {campaign.max_score})</option>
                            ))}
                          </select>
                          {((showErrors && campaignIdError) || editErrors.campaign_id) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn phong trào</p>
                          )}
                        </>
                      ) : (
                        <Tooltip title={activity.campaign_name || "-"} placement="topLeft">
                          <span className={campaignIdError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                            {truncateText(activity.campaign_name, 25)}
                          </span>
                        </Tooltip>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${showErrors && (pointError || pointExceedsCampaignError) ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={activity.point}
                            onChange={(e) => handleActivityChange(index, 'point', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && (pointError || pointExceedsCampaignError)) || editErrors.point ? 'border-red-600 bg-red-50' : ''}`}
                            step="any"
                            min={-100}
                            max={100}
                          />
                          {((showErrors && pointError) || editErrors.point && !pointExceedsCampaignError) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Điểm không hợp lệ</p>
                          )}
                          {((showErrors && pointExceedsCampaignError) || (editErrors.point && pointExceedsCampaignError)) && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              Điểm tối đa ({currentcampaigns.find(c => c.id === activity.campaign_id)?.max_score})
                            </p>
                          )}
                        </>
                      ) : (
                        <span className={`${(pointError || pointExceedsCampaignError) && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""} ${activity.point < 0 ? "text-red-600 font-medium" : activity.point > 0 ? "text-green-600 font-medium" : ""
                          }`}>
                          {activity.point < 0 ? `${activity.point} (điểm trừ)` : activity.point}
                          {showErrors && pointExceedsCampaignError && (
                            <span className="block text-xs text-red-600 font-medium mt-1">
                              Vượt quá điểm tối đa {currentcampaigns.find(c => c.id === activity.campaign_id)?.max_score}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${showErrors && maxParticipantsError ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={activity.max_participants}
                            onChange={(e) => handleActivityChange(index, 'max_participants', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && maxParticipantsError) || editErrors.max_participants ? 'border-red-600 bg-red-50' : ''}`}
                            min="0"
                          />
                          {((showErrors && maxParticipantsError) || editErrors.max_participants) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Số lượng phải là số không âm</p>
                          )}
                        </>
                      ) : (
                        <span className={maxParticipantsError && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {activity.max_participants}
                        </span>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${showErrors && (registrationStartError || dateOrderError) ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="date"
                            value={formatDate(activity.registration_start)}
                            onChange={(e) => handleActivityChange(index, 'registration_start', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && (registrationStartError || dateOrderError)) || editErrors.registration_start ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && registrationStartError) || editErrors.registration_start) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn ngày bắt đầu</p>
                          )}
                          {((showErrors && dateOrderError) || editErrors.registration_start) && !registrationStartError && (
                            <p className="text-xs text-red-600 font-medium mt-1">Ngày bắt đầu phải trước ngày kết thúc</p>
                          )}
                        </>
                      ) : (
                        <span className={(registrationStartError || dateOrderError) && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {formatDate(activity.registration_start) || "-"}
                        </span>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${showErrors && (registrationEndError || dateOrderError) ? 'bg-red-100' : ''}`}>
                      {isEditing ? (
                        <>
                          <input
                            type="date"
                            value={formatDate(activity.registration_end)}
                            onChange={(e) => handleActivityChange(index, 'registration_end', e.target.value)}
                            className={`w-full border rounded px-2 py-1 ${(showErrors && (registrationEndError || dateOrderError)) || editErrors.registration_end ? 'border-red-600 bg-red-50' : ''}`}
                          />
                          {((showErrors && registrationEndError) || editErrors.registration_end) && (
                            <p className="text-xs text-red-600 font-medium mt-1">Vui lòng chọn ngày kết thúc</p>
                          )}
                          {((showErrors && dateOrderError) || editErrors.registration_end) && !registrationEndError && (
                            <p className="text-xs text-red-600 font-medium mt-1">Ngày kết thúc phải sau ngày bắt đầu</p>
                          )}
                        </>
                      ) : (
                        <span className={(registrationEndError || dateOrderError) && showErrors ? "text-red-700 font-semibold border-b-2 border-red-500" : ""}>
                          {formatDate(activity.registration_end) || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-4">
                      {isEditing ? (
                        <select
                          value={activity.status}
                          onChange={(e) => handleActivityChange(index, 'status', e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="ongoing">Đang diễn ra</option>
                          <option value="expired">Đã kết thúc</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${activity.status === 'ongoing'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {activity.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Sửa">
                              <button
                                onClick={() => handleEditRow(index)}
                                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                disabled={editingIndex !== null}
                              >
                                <SquarePen size={20} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                                disabled={editingIndex !== null}
                              >
                                <Trash size={20} />
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-4 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing}
              className={`px-6 py-2 rounded text-white ${importing ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {importing ? "Đang import..." : "Import Hoạt động"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
