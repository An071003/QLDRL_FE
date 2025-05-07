"use client";

import { StudentLayout } from "@/components/layout/student";
import type { Activity } from "@/types/activity";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Tabs, Table, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TabsProps } from "antd";


export default function AssignActivitiesPage() {
    const [studentId, setStudentId] = useState<string>("");
    const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
    const [registeredActivities, setRegisteredActivities] = useState<Activity[]>([]);
    const [selectedToRegister, setSelectedToRegister] = useState<number[]>([]);
    const [selectedToCancel, setSelectedToCancel] = useState<number[]>([]);

    const columns: ColumnsType<Activity> = [
        { title: "Tên hoạt động", dataIndex: "name", key: "name" },
        { title: "Phong trào", dataIndex: "campaign_name", key: "campaign_name" },
        { title: "Điểm", dataIndex: "point", key: "point" },
    ];

    useEffect(() => {
        fetchCurrentStudent();
    }, []);


    const fetchCurrentStudent = async () => {
        try {
            const res = await api.get("/api/auth/me");
            const studentId = res.data.data?.studentId;
            if (!studentId) throw new Error("Không tìm thấy mã sinh viên");
            setStudentId(studentId);
            console.log("Student ID:", studentId);
            fetchAvailableActivities(studentId);
            fetchRegisteredActivities(studentId);
        } catch (err) {
            console.error("Không thể lấy thông tin sinh viên:", err);
        }
    };


    const fetchAvailableActivities = async (id: string) => {
        try {
            const res = await api.get(`/api/student-activities/${id}/available`);
            setAvailableActivities(res.data.data);
        } catch (err) {
            console.error("Lỗi khi lấy hoạt động chưa đăng ký:", err);
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
            console.error("Lỗi khi đăng ký:", err);
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
            console.error("Lỗi khi hủy:", err);
            message.error("Lỗi khi hủy đăng ký");
        }
    };

    const tabItems: TabsProps["items"] = [
        {
            key: "register",
            label: "Đăng ký",
            children: (
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
                    />
                    <div className="text-right mt-4">
                        <Button type="primary" disabled={!selectedToRegister.length} onClick={handleRegister}>
                            Đăng ký
                        </Button>
                    </div>
                </>
            ),
        },
        {
            key: "cancel",
            label: "Hủy",
            children: (
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
                    />
                    <div className="text-right mt-4">
                        <Button danger disabled={!selectedToCancel.length} onClick={handleCancel}>
                            Hủy đăng ký
                        </Button>
                    </div>
                </>
            ),
        },
    ];
    return (
        <StudentLayout>
            <div className="p-4">
                <h1 className="text-xl font-semibold mb-4">Đăng ký tham gia hoạt động</h1>
                <Tabs items={tabItems} />
            </div>
        </StudentLayout>
    );
}

