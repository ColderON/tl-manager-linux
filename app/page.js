"use client";
import Link from "next/link";
import './globals.css';

const pages = [
  { title: "Preisliste", href: "/preisliste" },
  { title: "Laufkarte erstellen", href: "/laufkarte" },
  { title: "Laufkartenliste", href: "/laufkarten-liste" },
];

export default function HomeMenu() {
  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Bereich auswählen</h1>
        <ul className="home-list">
        {pages.map((page) => (
            <li key={page.href}>
              <Link href={page.href} className="home-link">
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}