import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Anton } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const anton = Anton({
  variable: '--font-anton',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '24h Orto — You can be hero just for one day',
  description:
    'Torneo 24h Orto, ventunesima edizione. 18/19 luglio 2026. You can be hero just for one day.',
  generator: 'v0.app',
  icons: {
    icon: '/logo-24ore.png',
    apple: '/logo-24ore.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1a151e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
