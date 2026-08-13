import './globals.css';

export const metadata = {
  title: 'Mafia — Le jeu',
  description: 'Jeu de Mafia multijoueur en ligne',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
