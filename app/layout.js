import './globals.css';

export const metadata = {
  title: 'Mafia — Le jeu',
  description: 'Jeu de Mafia multijoueur en ligne',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport = {
  themeColor: '#0a0a0d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
