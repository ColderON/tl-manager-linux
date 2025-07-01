'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export const navLinks = [
  { title: 'Startseite', href: '/' },
  { title: 'Preisliste', href: '/preisliste' },
  { title: 'Laufkarte erstellen', href: '/laufkarte' },
  { title: 'Laufkartenliste', href: '/laufkarten-liste' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      {navLinks.map(({ title, href }) => {
        const isActive = pathname === href;
        const className = [
          title === 'Startseite' ? styles.navlinkStartseite : styles.navlink,
          isActive && styles['navlink--active'],
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Link key={href} href={href} className={className}>
            {title}
          </Link>
        );
      })}
    </nav>
  );
}
