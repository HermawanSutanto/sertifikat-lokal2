// src/app/page.js
"use client";

import { useState, useEffect } from "react";
import Draggable from "react-draggable"; // Import library

// Komponen ikon spinner (tetap sama)
function Spinner(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12,23a9.63,9.63,0,0,1-8-9.5,9.51,9.51,0,0,1,6.79-9.1A1,1,0,0,1,12,5.19a8.4,8.4,0,0,0-6.1,8.31,8.44,8.44,0,0,0,8.38,8.38A1,1,0,0,1,12,23Z"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          dur="0.75s"
          from="0 12 12"
          to="360 12 12"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

export default function Home() {
  const [templateFile, setTemplateFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [names, setNames] = useState("Andi Budi, Candra Dwi");
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE BARU UNTUK KUSTOMISASI ---
  const [position, setPosition] = useState({ x: 0, y: 240 }); // Posisi awal teks (tengah)
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [textColor, setTextColor] = useState("#333333");

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setTemplateFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Hapus preview lama
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Fungsi untuk handle drag
  const handleDrag = (e, ui) => {
    setPosition({ x: ui.x, y: ui.y });
  };

  // Membersihkan object URL saat komponen di-unmount untuk mencegah memory leak
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleGenerate = async () => {
    if (!templateFile) {
      alert("Pilih file template dulu!");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    // Kirim semua data kustomisasi ke backend
    formData.append("template", templateFile);
    formData.append("names", names);
    formData.append("positionX", position.x);
    formData.append("positionY", position.y);
    formData.append("fontSize", fontSize);
    formData.append("fontFamily", fontFamily);
    formData.append("textColor", textColor);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Terjadi kesalahan pada server.");
      }
      alert(`Sukses! Cek folder 'generated-certificates' di Supabase.`);
    } catch (error) {
      console.error("Error saat generate:", error);
      alert(`Gagal membuat sertifikat: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kolom Kiri: Panel Kontrol */}
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Certificate Generator</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Buat sertifikat secara otomatis
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                1. Upload Template (PNG/JPG)
              </label>
              {/* Tampilkan preview jika ada */}
              {previewUrl && (
                <div className="mb-4">
                  <img
                    src={previewUrl}
                    alt="Template Preview"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}
              <label
                htmlFor="file-upload"
                className="w-full flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {templateFile
                      ? `Ganti file: ${templateFile.name}`
                      : "Klik untuk memilih file"}
                  </p>
                </div>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/png, image/jpeg"
                onChange={handleFileChange} // <-- Gunakan fungsi baru
              />
            </div>

            <div>
              <label
                htmlFor="names"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                2. Masukkan Nama (pisahkan dengan koma)
              </label>
              <textarea
                id="names"
                rows={5}
                className="w-full px-3 py-2 border rounded-md shadow-sm resize-none bg-transparent border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                value={names}
                onChange={(e) => setNames(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !templateFile}
            className="w-full flex items-center justify-center px-4 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800 transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Memproses...
              </>
            ) : (
              "Generate Sertifikat"
            )}
          </button>
        </div>

        {/* Kolom Kanan: Pratinjau Interaktif */}
        <div className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center">
          {previewUrl ? (
            <div className="relative w-[500px] h-[350px] overflow-hidden border">
              <img
                src={previewUrl}
                alt="Template Preview"
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
              <Draggable
                bounds="parent"
                position={position}
                onStop={handleDrag}
              >
                <div
                  className="cursor-move p-2"
                  style={{
                    color: textColor,
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: "bold",
                    position: "absolute", // Penting untuk Draggable
                    whiteSpace: "nowrap"
                  }}
                >
                  Nama Peserta
                </div>
              </Draggable>
            </div>
          ) : (
            <div className="w-[500px] h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <p>Upload template untuk melihat pratinjau</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Catatan: Sebagian UI di atas disederhanakan untuk fokus pada fungsionalitas.
// Anda bisa menggabungkannya dengan UI lengkap Anda sebelumnya.
