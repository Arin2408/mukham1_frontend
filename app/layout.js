import './globals.css';
import { Archivo } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '../context/AuthContext';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, publicPage } from '@/lib/site';

const archivo = Archivo({ subsets: ['latin'] });

// Pages add their own title (shown as "Title | Mukham"); see lib/site.js.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  ...publicPage({ title: 'Attendance & Team Management', description: SITE_DESCRIPTION, path: '/' }),
  title: { default: 'Mukham - Attendance & Team Management', template: '%s | Mukham' },
  applicationName: SITE_NAME,
  themeColor: '#0a0a0a',
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
