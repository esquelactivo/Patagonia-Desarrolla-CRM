import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InmoCRM',
  description: 'Sistema CRM para inmobiliarias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
