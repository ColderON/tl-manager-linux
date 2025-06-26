"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BeispielPage() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.onNavigate) {
      const handler = (path) => router.push(path);
      window.electronAPI.onNavigate(handler);
    }
  }, [router]);
  return (
    <div style={{ padding: 32 }}>
      <h1>Beispiel</h1>
      <p>Это пример третьей страницы.</p>
    </div>
  );
} 