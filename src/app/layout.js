import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "../context/AuthContext"; // <-- IMPORT

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SertiGen: Generator Sertifikat Online Cepat & Mudah",
  description:
    "Buat ribuan sertifikat personal secara otomatis. Cukup unggah template, masukkan daftar nama, dan unduh sertifikat berkualitas tinggi dalam hitungan menit.",
  keywords:
    "generator sertifikat, buat sertifikat online, aplikasi sertifikat, sertifikat massal, otomatisasi sertifikat, SertiGen",
  openGraph: {
    title: "SertiGen: Generator Sertifikat Online Cepat & Mudah",
    description: "Buat ribuan sertifikat personal secara otomatis dan cepat.",
    url: "https://sertifikat-lokal2.vercel.app/", // Ganti dengan URL domain Anda
    siteName: "SertiGen",
    images: [
      {
        url: "/og-image.png", // Pastikan gambar ini ada di folder /public
        width: 1200,
        height: 630
      }
    ],
    locale: "id_ID",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&family=Montserrat&family=Playfair+Display&family=Poppins&family=Lora&family=Pacifico&family=Caveat&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthContextProvider>{children}</AuthContextProvider>{" "}
        {/* <-- WRAP DI SINI */}
      </body>
    </html>
  );
}
