import './globals.css';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="vi">
            <body>
                {children}
                <Toaster richColors position="top-center" />
            </body>
        </html>
    );
}