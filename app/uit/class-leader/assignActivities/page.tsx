"use client";

import { ClassleaderLayout } from "@/components/layout/class-leader";
import { ActivityRegistrationTabs } from "@/components/class-leader";
import type { Activity } from "@/types/activity";
import api from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { message } from "antd";

export default function ClassLeaderAssignActivitiesPage() {
    const [studentId, setStudentId] = useState<string>("");
    const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
    const [registeredActivities, setRegisteredActivities] = useState<Activity[]>([]);
    const [selectedToRegister, setSelectedToRegister] = useState<number[]>([]);
    const [selectedToCancel, setSelectedToCancel] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

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
            console.log("Available activities response:", res.data);
            setAvailableActivities(res.data.data || []);
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
            console.log("Registered activities response:", res.data);
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

    return (
        <ClassleaderLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký hoạt động - Lớp trưởng</h1>
                    <p className="text-gray-600">Đăng ký tham gia các hoạt động rèn luyện</p>
                </div>
                
                <ActivityRegistrationTabs
                    availableActivities={availableActivities}
                    registeredActivities={registeredActivities}
                    selectedToRegister={selectedToRegister}
                    selectedToCancel={selectedToCancel}
                    loading={loading}
                    onRegisterSelectionChange={setSelectedToRegister}
                    onCancelSelectionChange={setSelectedToCancel}
                    onRegister={handleRegister}
                    onCancel={handleCancel}
                />
            </div>
        </ClassleaderLayout>
    );
}

