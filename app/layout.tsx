// app/layout.tsx
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Quản lý sinh viên',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen px-5 ">
        <header className="flex items-center justify-between py-4 px-6 border-b bg-[#0b3c65] border-blue-900 text-white">
          <div className="flex items-center space-x-4">
            <img src="/banner.png" alt="Logo" className="w-auto h-auto text-[50px] object-contain" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <Link href="/login" className="hover:underline">Đăng nhập</Link>
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
          <a href="#" className="flex items-center space-x-2">
            <img src="/home-icon.png" alt="Home" className="w-8 h-8" />
          </a>
        </nav>

        <main className="p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
