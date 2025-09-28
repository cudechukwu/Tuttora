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
  description: 'Connect with university students for real-time academic assistance and tutoring. Get instant help with homework, assignments, and study sessions from verified peer tutors.',
  keywords: ['tutoring', 'academic support', 'university', 'peer learning', 'education', 'homework help', 'study sessions', 'peer tutoring', 'academic assistance', 'student support'],
  authors: [{ name: 'Tuttora Team' }],
  creator: 'Tuttora',
  publisher: 'Tuttora',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tuttora.app',
    siteName: 'Tuttora',
    title: 'Tuttora - Peer-to-Peer Academic Assistance',
    description: 'Connect with university students for real-time academic assistance and tutoring. Get instant help with homework, assignments, and study sessions.',
    images: [
      {
        url: 'https://tuttora.app/images/logo/TP_Logo.png',
        width: 1200,
        height: 630,
        alt: 'Tuttora - Peer-to-Peer Academic Assistance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tuttora - Peer-to-Peer Academic Assistance',
    description: 'Connect with university students for real-time academic assistance and tutoring.',
    images: ['https://tuttora.app/images/logo/TP_Logo.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Replace with actual code from Google Search Console
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