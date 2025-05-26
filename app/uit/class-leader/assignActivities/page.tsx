"use client";

import { ClassleaderLayout } from "@/components/layout/class-leader";
import type { Activity } from "@/types/activity";
import api from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { Tabs, Table, Button, message, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TabsProps } from "antd";


export default function AssignActivitiesPage() {
    const [studentId, setStudentId] = useState<string>("");
    const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
    const [registeredActivities, setRegisteredActivities] = useState<Activity[]>([]);
    const [selectedToRegister, setSelectedToRegister] = useState<number[]>([]);
    const [selectedToCancel, setSelectedToCancel] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const columns: ColumnsType<Activity> = [
        { 
            title: "Tên hoạt động", 
            dataIndex: "name", 
            key: "name",
            ellipsis: {
                showTitle: false,
            },
            render: (name) => (
                <Tooltip placement="topLeft" title={name}>
                    <span>{name}</span>
                </Tooltip>
            )
        },
        { 
            title: "Phong trào", 
            dataIndex: ["Campaign", "name"], 
            key: "campaign_name",
            ellipsis: {
                showTitle: false,
            },
            render: (text, record) => (
                <Tooltip placement="topLeft" title={record.Campaign?.name}>
                    <span>{record.Campaign?.name}</span>
                </Tooltip>
            )
        },
        { title: "Điểm", dataIndex: "point", key: "point" },
    ];

    const fetchCurrentStudent = useCallback(async () => {
        try {
            const res = await api.get("/api/auth/me");
            const studentId = res.data.data.user.Student.student_id;
            if (!studentId) throw new Error("Không tìm thấy mã sinh viên");
            setStudentId(studentId);
            fetchAvailableActivities(studentId);
            fetchRegisteredActivities(studentId);
        } catch (err) {
            console.error("Không thể lấy thông tin sinh viên:", err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentStudent();
    }, [fetchCurrentStudent]);

    const fetchAvailableActivities = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/student-activities/${id}/available`);
            setAvailableActivities(res.data.data);
        } catch (err) {
            console.error("Lỗi khi lấy hoạt động chưa đăng ký:", err);
            message.error("Không thể tải hoạt động khả dụng");
        } finally {
            setLoading(false);
        }
    };

    const fetchRegisteredActivities = async (id: string) => {
        try {
            const res = await api.get(`/api/student-activities/student/${id}`);
            const activities = res.data.data;
            const filtered = Array.isArray(activities) ? activities.filter(a => a.status === "ongoing") : [];
            setRegisteredActivities(filtered);
        } catch (err) {
            console.error("Lỗi khi lấy hoạt động đã đăng ký:", err);
            message.error("Không thể tải hoạt động đã đăng ký");
        }
    };

    const handleRegister = async () => {
        try {
            for (const activityId of selectedToRegister) {
                await api.post(`/api/student-activities/${activityId}/students`, {
                    studentIds: [studentId],
                });
            }
            message.success("Đăng ký thành công");
            setSelectedToRegister([]);
            fetchAvailableActivities(studentId);
            fetchRegisteredActivities(studentId);
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi đăng ký");
        }
    };

    const handleCancel = async () => {
        try {
            for (const activityId of selectedToCancel) {
                await api.delete(`/api/student-activities/${activityId}/students/${studentId}`);
            }
            message.success("Hủy đăng ký thành công");
            setSelectedToCancel([]);
            fetchAvailableActivities(studentId);
            fetchRegisteredActivities(studentId);
        } catch (err) {
            console.error(err);
            message.error("Lỗi khi hủy đăng ký");
        }
    };

    const tabItems: TabsProps["items"] = [
        {
            key: "register",
            label: "Đăng ký",
            children: (
                <>
                    {availableActivities.length > 0 ? (
                        <>
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={availableActivities}
                                rowSelection={{
                                    selectedRowKeys: selectedToRegister,
                                    onChange: (keys) => setSelectedToRegister(keys as number[]),
                                }}
                                pagination={false}
                                loading={loading}
                            />
                            <div className="text-right mt-4">
                                <Button type="primary" disabled={!selectedToRegister.length} onClick={handleRegister}>
                                    Đăng ký
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Empty 
                            description={loading ? "Đang tải..." : "Không có hoạt động nào khả dụng để đăng ký"} 
                            className="py-12"
                        />
                    )}
                </>
            ),
        },
        {
            key: "cancel",
            label: "Hủy",
            children: (
                <>
                    {registeredActivities.length > 0 ? (
                        <>
                            <Table
                                rowKey="id"
                                columns={columns}
                                dataSource={registeredActivities}
                                rowSelection={{
                                    selectedRowKeys: selectedToCancel,
                                    onChange: (keys) => setSelectedToCancel(keys as number[]),
                                }}
                                pagination={false}
                                loading={loading}
                            />
                            <div className="text-right mt-4">
                                <Button danger disabled={!selectedToCancel.length} onClick={handleCancel}>
                                    Hủy đăng ký
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Empty 
                            description={loading ? "Đang tải..." : "Bạn chưa đăng ký hoạt động nào"} 
                            className="py-12"
                        />
                    )}
                </>
            ),
        },
    ];
    return (
        <ClassleaderLayout>
            <div className="p-4">
                <h1 className="text-xl font-semibold mb-4">Đăng ký tham gia hoạt động</h1>
                <Tabs items={tabItems} />
            </div>
        </ClassleaderLayout>
    );
}

