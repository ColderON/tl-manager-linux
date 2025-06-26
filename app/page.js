"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from './page.module.css';
import Link from 'next/link';

const pages = [
  { title: 'Preisliste', href: '/preisliste' },
  { title: 'Laufkarte', href: '/laufkarte' },
  { title: 'Beispiel', href: '/beispiel' },
];

export default function HomeMenu() {
  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 32, border: '1px solid #eee', borderRadius: 12, background: '#fafbfc' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Bereich auswählen</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pages.map((page) => (
          <li key={page.href} style={{ margin: '24px 0', textAlign: 'center' }}>
            <Link href={page.href} style={{ fontSize: 22, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}