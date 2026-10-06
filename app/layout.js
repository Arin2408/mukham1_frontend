import './globals.css';
import { Archivo } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '../context/AuthContext';

const archivo = Archivo({ subsets: ['latin'] });

export const metadata = {
  title: 'Mukham - Organization Management',
  description: 'Modern organization management platform for roles, attendance, and shifts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={archivo.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider> 
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
