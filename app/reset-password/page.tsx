"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { MainLayout } from "@/components/layout";
import { ErrorModal } from "@/components/ErrorModal";
import { NotificationModal } from "@/components/NotificationModal";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [successNotification, setSuccessNotification] = useState(false);

  const [countdown, setCountdown] = useState(0); // 0 là chưa đếm
  const [isCounting, setIsCounting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearTimeout(timer);
  }, [isCounting, countdown]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSendOtp = async () => {
    try {
      await api.post("/api/auth/send-otp", { email });
      setIsCounting(true);
      setCountdown(600);
    } catch (error: any) {
      setError(error.response?.data?.message || "Lỗi gửi mã xác thực.");
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await api.post("/api/auth/reset-password", { email, otp, newPassword });
      setNotification(response.data.message);
      setSuccessNotification(true);
      router.push("/login");
    } catch (error: any) {
      setError(error.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <MainLayout>
      {error && <ErrorModal message={error} onClose={() => setError("")} />}
      {notification && <NotificationModal message={notification} onClose={() => setNotification("")} />}
      <div className="min-h-px flex justify-center bg-gray-50 py-12 px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="space-y-4">
            <h2 className="text-center text-2xl font-semibold text-gray-700">Quên mật khẩu</h2>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
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
              <label htmlFor="otp" className="block text-sm font-medium text-gray-600">Mã xác thực</label>
              <div className="flex justify-between mt-2 items-center">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="block w-[60%] px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={isCounting}
                  className={`mt-2 px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2
                    ${isCounting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"}
                  `}
                >
                  {isCounting ? `Gửi lại mã sau ${formatTime(countdown)}` : "Lấy mã"}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600">Mật khẩu mới</label>
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
                Cập nhật mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPasswordPage;
