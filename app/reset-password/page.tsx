"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { MainLayout } from "@/components/layout";
import { ErrorModal } from "@/components/ErrorModal";
import { NotificationModal } from "@/components/NotificationModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const ResetPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [notification, setNotification] = useState("");
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const router = useRouter();

    const handleSendOtp = async () => {
        try {
            const response = await api.post("/api/auth/send-otp", { email });
            setNotification(response.data.message);
        } catch (error: any) {
            setError(error.response?.data?.message || "Error sending OTP");
        }
    };

    const handleResetPassword = async () => {
        try {
            const response = await api.post("/api/auth/reset-password", { email, otp, newPassword });
            setNotification(response.data.message);
            setIsConfirmationOpen(true);
        } catch (error: any) {
            setError(error.response?.data?.message || "Error resetting password");
        }
    };

    const handleConfirmation = () => {
        setIsConfirmationOpen(false);
        router.push("/login");
    };

    const handleCancelConfirmation = () => {
        setIsConfirmationOpen(false);
    };

    return (
        <MainLayout>
            {error && <ErrorModal message={error} onClose={() => setError("")} />}
            {notification && <NotificationModal message={notification} onClose={() => setNotification("")} />}
            {isConfirmationOpen && (
                <ConfirmationModal
                    message="Do you want to go to the login page?"
                    onConfirm={handleConfirmation}
                    onCancel={handleCancelConfirmation}
                />
            )}

            <div className="min-h-px flex justify-center bg-gray-50 py-12 px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                    <div className="space-y-4">
                        <h2 className="text-center text-2xl font-semibold text-gray-700">Reset Password</h2>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-600">Enter your email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-2 block w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-600">Enter OTP</label>
                            <div className="flex justify-between mt-2">
                                <div>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        className="mt-2 block w-[120%] px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={handleSendOtp}
                                    className="mt-2 block w-fit px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Send OTP
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600">New Password</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="mt-2 block w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleResetPassword}
                                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ResetPasswordPage;
