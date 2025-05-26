import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Quản lý sinh viên',
};

export function MainLayout({ children }: { children: React.ReactNode }) {
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
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/house-user-solid.svg" 
            alt="Home" 
            width={32}
            height={32}
            className="w-8 h-8"
          />
        </Link>
      </nav>

      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
