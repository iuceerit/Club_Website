import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import './main.css';
import { ThemeProvider } from "../components/main"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IUCEE-RIT",
  description: "Fostering Innovation and Excellence in Engineering Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* DELETE the entire <script> tag that was here previously */}
      </head>
      <body className={inter.className}>
        {/* Wrap children with the Provider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}