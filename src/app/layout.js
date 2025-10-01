import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Candy Kush Kiosk",
  description: "Product Ordering Kiosk System",
};

import I18nProvider from "../components/I18nProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" style={{ colorScheme: "light" }}>
      <body
        className={`${poppins.variable} font-sans antialiased`}
        style={{
          colorScheme: "light",
          background: "#ffffff",
          color: "#171717",
        }}
      >
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
