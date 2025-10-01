import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "../context/AuthContext"; // <-- IMPORT

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Certificate Generator",
  description: "Generate certificates easily"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthContextProvider>{children}</AuthContextProvider>{" "}
        {/* <-- WRAP DI SINI */}
      </body>
    </html>
  );
}
