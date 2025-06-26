import Link from 'next/link';
import styles from '../page.module.css';

const navLinks = [
  { title: 'Главная', href: '/' },
  { title: 'Preisliste', href: '/preisliste' },
  { title: 'Laufkarte', href: '/laufkarte' },
  { title: 'Beispiel', href: '/beispiel' },
];

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className={styles.navlink}>
          {link.title}
        </Link>
      ))}
    </nav>
  );
} 