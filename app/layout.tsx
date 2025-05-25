'use client';

import './globals.css';
import { Toaster } from 'sonner';
import { Suspense } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <Suspense fallback={null}>
                    {children}
                    <Toaster richColors position="top-center" />
                </Suspense>
            </body>
        </html>
    );
}