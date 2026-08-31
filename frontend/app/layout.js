export const metadata = {
  title: 'Caixa de Memórias Digital - Villa do Conde',
  description: 'Plataforma de estimulação cognitiva e memória afetiva para idosos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-villa-light">
        {children}
      </body>
    </html>
  );
}