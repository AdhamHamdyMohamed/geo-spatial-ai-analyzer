import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GeoAI Spatial Assistant | WebGIS & Urban Intelligence',
  description:
    'Production WebGIS AI application analyzing urban walkability, safety, public transport, and spatial POIs with Anthropic Claude and Leaflet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
