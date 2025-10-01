"use client";

import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable"; // Pastikan sudah di-install: npm install react-draggable

// Komponen ikon spinner untuk loading
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
  const [certificates, setCertificates] = useState([]);

  // State untuk kustomisasi
  const [positionPercent, setPositionPercent] = useState({ x: 0.5, y: 0.5 }); // Menyimpan posisi sebagai persentase
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [textColor, setTextColor] = useState("#333333");

  // State untuk menyimpan ukuran piksel dari kotak pratinjau
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const nodeRef = useRef(null);
  const previewContainerRef = useRef(null); // Ref untuk kontainer pratinjau

  // Fungsi untuk menangani perubahan file
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setTemplateFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset posisi ke tengah setiap kali ganti gambar
      setPositionPercent({ x: 0.5, y: 0.5 });
    }
  };

  // Fungsi untuk menangani pergeseran teks (drag)
  const handleDrag = (e, ui) => {
    const container = previewContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();

    // Hitung posisi tengah dari elemen yang di-drag
    const textElementWidth = nodeRef.current.offsetWidth;
    const textElementHeight = nodeRef.current.offsetHeight;
    const newX = ui.x + textElementWidth / 2;
    const newY = ui.y + textElementHeight / 2;

    // Konversi ke persentase dan simpan
    setPositionPercent({
      x: newX / width,
      y: newY / height
    });
  };

  // Fetch daftar sertifikat dari API
  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/certificates");
      if (!response.ok) {
        console.error("Gagal mengambil data, status:", response.status);
        return;
      }
      const data = await response.json();
      setCertificates(data.certificates);
    } catch (error) {
      console.error("Gagal mengambil daftar sertifikat:", error);
    }
  };

  // Efek untuk mengukur kontainer pratinjau saat gambar berubah
  useEffect(() => {
    if (previewUrl && previewContainerRef.current) {
      const { width, height } =
        previewContainerRef.current.getBoundingClientRect();
      setPreviewSize({ width, height });
    }
  }, [previewUrl]);

  // Jalankan fetch saat komponen pertama kali dimuat
  useEffect(() => {
    fetchCertificates();
  }, []);

  // Membersihkan object URL saat komponen di-unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fungsi untuk mengirim data ke backend dan generate sertifikat
  const handleGenerate = async () => {
    if (!templateFile) {
      alert("Pilih file template dulu!");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("template", templateFile);
    formData.append("names", names);
    formData.append("positionXPercent", positionPercent.x);
    formData.append("positionYPercent", positionPercent.y);
    formData.append("fontSize", fontSize); // Ukuran font di preview

    // --- TAMBAHKAN BARIS INI ---
    // Kirim lebar kontainer preview sebagai referensi skala
    formData.append("previewWidth", previewSize.width);

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
      fetchCertificates(); // Refresh daftar setelah berhasil generate
    } catch (error) {
      console.error("Error saat generate:", error);
      alert(`Gagal membuat sertifikat: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hitung posisi piksel untuk properti `position` dari Draggable
  const pixelPosition = {
    x:
      previewSize.width * positionPercent.x -
      (nodeRef.current?.offsetWidth / 2 || 0),
    y:
      previewSize.height * positionPercent.y -
      (nodeRef.current?.offsetHeight / 2 || 0)
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kolom Kiri: Panel Kontrol */}
        <div className="w-full p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Certificate Generator</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Atur dan buat sertifikat secara otomatis
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                1. Upload Template
              </label>
              <label
                htmlFor="file-upload"
                className="w-full flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-indigo-500 transition-colors"
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
                type="file"
                className="sr-only"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <label
                htmlFor="names"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                2. Masukkan Nama (pisahkan koma)
              </label>
              <textarea
                id="names"
                rows={4}
                className="w-full px-3 py-2 border rounded-md shadow-sm resize-none bg-transparent border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={names}
                onChange={(e) => setNames(e.target.value)}
              />
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-medium">3. Kustomisasi Teks</h3>
              <div>
                <label htmlFor="fontSize" className="block text-sm font-medium">
                  Ukuran Font: <span className="font-bold">{fontSize}px</span>
                </label>
                <input
                  id="fontSize"
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fontFamily"
                    className="block text-sm font-medium"
                  >
                    Jenis Font
                  </label>
                  <select
                    id="fontFamily"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-transparent border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option>Roboto</option>
                    <option>Montserrat</option>
                    <option>Playfair Display</option>
                    <option>Arial</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="textColor"
                    className="block text-sm font-medium"
                  >
                    Warna Teks
                  </label>
                  <input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full mt-1 h-10 p-1 border rounded-md cursor-pointer bg-transparent border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !templateFile}
            className="w-full flex items-center justify-center px-4 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" /> Memproses...
              </>
            ) : (
              "Generate Sertifikat"
            )}
          </button>
        </div>

        {/* Kolom Kanan: Pratinjau Interaktif */}
        <div className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center lg:h-full">
          {previewUrl ? (
            <div
              ref={previewContainerRef}
              className="relative w-[500px] h-[350px] overflow-hidden border rounded-lg bg-slate-200"
            >
              <img
                src={previewUrl}
                alt="Template Preview"
                className="absolute top-0 left-0 w-full h-full object-contain"
              />
              {previewSize.width > 0 && (
                <Draggable
                  nodeRef={nodeRef}
                  bounds="parent"
                  position={pixelPosition}
                  onStop={handleDrag}
                >
                  <div
                    ref={nodeRef}
                    className="cursor-move absolute p-2"
                    style={{ top: 0, left: 0, whiteSpace: "nowrap" }}
                  >
                    <span
                      style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        fontWeight: "bold",
                        textShadow: "0 0 5px rgba(255,255,255,0.7)"
                      }}
                    >
                      Nama Peserta
                    </span>
                  </div>
                </Draggable>
              )}
            </div>
          ) : (
            <div className="w-[500px] h-[350px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center">
              <p className="font-semibold">Pratinjau Template</p>
              <p className="text-sm text-slate-500">
                Upload template untuk mengatur posisi teks
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Daftar Hasil Generate */}
      <div className="w-full max-w-6xl mt-12">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Hasil Generate Terbaru</h2>
          {certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {cert.namaPeserta}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Dibuat pada:{" "}
                      {new Date(
                        cert.dibuatPada.seconds * 1000
                      ).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  <a
                    href={cert.urlSertifikat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Lihat
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Belum ada sertifikat yang dibuat.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
