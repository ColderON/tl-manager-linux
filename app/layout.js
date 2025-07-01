import "./globals.css";
import Navbar from './components/Navbar';

export const metadata = {
  title: "TL Manager",
  description: "Desktop TL Manager",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <Navbar />
        <div className="container">
        {children}
        </div>
      </body>
    </html>
  );
}
