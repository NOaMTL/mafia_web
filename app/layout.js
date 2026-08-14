import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'Mafia — Le jeu',
  description: 'Jeu de Mafia multijoueur en ligne',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport = {
  themeColor: '#16161d',
};

// Applique le thème sauvegardé avant le premier rendu pour éviter un flash
const themeInit = `try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
