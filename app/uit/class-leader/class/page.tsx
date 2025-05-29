'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Loading from '@/components/Loading';
import { Student } from '@/types/student';
import { toast } from 'sonner';
import { ClassleaderLayout } from '@/components/layout/class-leader';
import { StudentManagementTable } from '@/components/class-leader';

// Extend the Student type with User field if needed
interface ExtendedStudent extends Student {
    User?: {
        email: string;
    };
}

export default function ClassleaderStudentsPage() {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<ExtendedStudent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/students/classleader');
            if (res.data.data.students) {
                setStudents(res.data.data.students);
            } else if (Array.isArray(res.data.data)) {
                setStudents(res.data.data);
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error('Failed to fetch students:', err);
            toast.error('Không thể tải danh sách sinh viên');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewStudent = (studentId: string) => {
        // Navigate to student detail page
        window.open(`/uit/advisor/students/${studentId}`, '_blank');
    };

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.Class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading />;

    return (
        <ClassleaderLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý sinh viên lớp</h1>
                    <p className="text-gray-600">Xem danh sách và thông tin sinh viên trong lớp của bạn</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Danh sách sinh viên ({filteredStudents.length}/{students.length})
                    </h2>
                    
                    <StudentManagementTable
                        students={filteredStudents}
                        loading={loading}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onViewStudent={handleViewStudent}
                    />
                </div>
            </div>
        </ClassleaderLayout>
    );
} 