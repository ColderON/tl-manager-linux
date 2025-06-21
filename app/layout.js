import "./globals.css";

export const metadata = {
  title: "TL Manager",
  description: "Desktop TL Manager",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
