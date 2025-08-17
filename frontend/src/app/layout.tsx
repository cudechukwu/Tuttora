import type { Metadata, Viewport } from 'next'
import { Inter, Ubuntu } from 'next/font/google'
import './globals.css'
import { SocketProviderWrapper } from '@/components/SocketProviderWrapper'
import { ToastProvider } from '@/contexts/ToastContext'
import AppClientWrapper from '@/components/AppClientWrapper'

const inter = Inter({ subsets: ['latin'] })
const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu'
})

export const metadata: Metadata = {
  title: 'Tuttora - Peer-to-Peer Academic Assistance',
  description: 'Connect with university students for real-time academic assistance and tutoring',
  keywords: ['tutoring', 'academic support', 'university', 'peer learning', 'education'],
  authors: [{ name: 'Tuttora Team' }],
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${ubuntu.variable}`}>
        <SocketProviderWrapper>
          <ToastProvider>
            <AppClientWrapper>
              {children}
            </AppClientWrapper>
          </ToastProvider>
        </SocketProviderWrapper>
      </body>
    </html>
  )
} 