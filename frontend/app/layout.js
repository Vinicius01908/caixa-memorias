import './globals.css';

export const metadata = {
  title: 'Caixa de Memorias Digital - Villa do Conde',
  description: 'Plataforma de estimulacao cognitiva e memoria afetiva para idosos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F8F5F0]">
        {children}
      </body>
    </html>
  );
}