// src/app/sitemap.js

export default function sitemap() {
  return [
    {
      url: "https://sertigen.com", // Ganti dengan URL domain Anda
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://sertigen.com/login", // Ganti dengan URL domain Anda
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sertigen.com/register", // Ganti dengan URL domain Anda
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}