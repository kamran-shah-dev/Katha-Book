import { ReactNode } from 'react';
import TopMenuBar from './TopMenuBar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopMenuBar />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
