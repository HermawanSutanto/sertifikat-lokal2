// src/app/sitemap.js

export default function sitemap() {
  return [
    {
      url: "https://sertifikat-lokal2.vercel.app/", // Ganti dengan URL domain Anda
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1
    },
    {
      url: "https://sertifikat-lokal2.vercel.app//login", // Ganti dengan URL domain Anda
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: "https://sertifikat-lokal2.vercel.app//register", // Ganti dengan URL domain Anda
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8
    }
  ];
}
