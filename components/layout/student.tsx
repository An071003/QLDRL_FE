"use client"
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import StudentDropdown from "@/components/students/StudentDropdown";

export const metadata = {
  title: 'Trang dành cho sinh viên',
};

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div>
      <header className="flex items-center justify-between py-4 px-6 border-b bg-[#0b3c65] border-blue-900 text-white">
        <div className="flex items-center space-x-4">
          <Image 
            src="/banner.png" 
            alt="Logo" 
            width={400}
            height={80}
            className="w-[90%] h-auto text-[50px] object-contain"
            priority
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <button onClick={handleLogout} className="hover:underline">Tài khoản</button>
            <span className="text-sm"> | </span>
            <button onClick={handleLogout} className="hover:underline">Thoát</button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search this site..."
              className="rounded-full px-4 py-1 text-gray-500 bg-white border border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
              🔍
            </button>
          </div>
        </div>
      </header>

      <nav className="flex items-center p-2 bg-[#0a3a60]">
        <Link href="/uit/student" className="flex items-center space-x-2">
          <Image 
            src="/house-user-solid.svg" 
            alt="Home" 
            width={32}
            height={32}
            className="w-8 h-8"
          />
        </Link>
        <div className="ml-4 mt-1.5">
          <StudentDropdown />
        </div>
      </nav>

      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
