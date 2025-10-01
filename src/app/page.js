"use client";

import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase"; // <-- Impor auth dari firebase.js
import { useAuth } from "../context/AuthContext"; // <-- Cukup satu impor useAuth

// Komponen ikon spinner untuk loading
function Spinner(props) {
  // ... (kode spinner tidak berubah)
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

// Komponen Notifikasi (Toast)
function Notification({ message, type, show }) {
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  return (
    <div
      className={`fixed top-5 right-5 p-4 rounded-lg text-white shadow-lg transition-transform transform ${
        show ? "translate-x-0" : "translate-x-full"
      } ${bgColor}`}
      style={{ zIndex: 1000 }}
    >
      {message}
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
  const [templateFile, setTemplateFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [names, setNames] = useState("Andi Budi, Candra Dwi");
  const [isLoading, setIsLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [positionPercent, setPositionPercent] = useState({ x: 0.5, y: 0.5 });
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [textColor, setTextColor] = useState("#333333");
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const nodeRef = useRef(null);
  const previewContainerRef = useRef(null);

  // Efek untuk notifikasi agar hilang otomatis
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Efek untuk melindungi halaman
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fungsi Fetch Certificates dengan token
  const fetchCertificates = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Gagal mengambil data dari server.");
      const data = await response.json();
      setCertificates(data.certificates);
    } catch (error) {
      console.error("Gagal mengambil daftar sertifikat:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fungsi Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Fungsi Generate dengan notifikasi
  const handleGenerate = async () => {
    if (!templateFile) {
      setNotification({
        show: true,
        message: "Pilih file template dulu!",
        type: "error"
      });
      return;
    }
    if (!user) {
      setNotification({
        show: true,
        message: "Sesi tidak valid, silakan login ulang.",
        type: "error"
      });
      router.push("/login");
      return;
    }
    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("names", names);
      formData.append("positionXPercent", positionPercent.x);
      formData.append("positionYPercent", positionPercent.y);
      formData.append("fontSize", fontSize);
      formData.append("previewWidth", previewSize.width);
      formData.append("fontFamily", fontFamily);
      formData.append("textColor", textColor);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Terjadi kesalahan pada server.");
      }
      setNotification({
        show: true,
        message: "Sukses! Sertifikat berhasil dibuat.",
        type: "success"
      });
      fetchCertificates();
    } catch (error) {
      console.error("Error saat generate:", error);
      setNotification({
        show: true,
        message: `Gagal: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi lain-lain
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setTemplateFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setPositionPercent({ x: 0.5, y: 0.5 });
    }
  };
  const handleDrag = (e, ui) => {
    const container = previewContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const textElementWidth = nodeRef.current.offsetWidth;
    const textElementHeight = nodeRef.current.offsetHeight;
    const newX = ui.x + textElementWidth / 2;
    const newY = ui.y + textElementHeight / 2;
    setPositionPercent({ x: newX / width, y: newY / height });
  };
  useEffect(() => {
    if (previewUrl && previewContainerRef.current) {
      const { width, height } =
        previewContainerRef.current.getBoundingClientRect();
      setPreviewSize({ width, height });
    }
  }, [previewUrl]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  const pixelPosition = {
    x:
      previewSize.width * positionPercent.x -
      (nodeRef.current?.offsetWidth / 2 || 0),
    y:
      previewSize.height * positionPercent.y -
      (nodeRef.current?.offsetHeight / 2 || 0)
  };

  // Tampilan loading
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8 text-indigo-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Memeriksa sesi...
          </p>
        </div>
      </div>
    );
  }

  // Tampilan utama
  return (
    <>
      <Notification {...notification} />
      <header className="bg-white shadow-md border-b border-blue-300">
        <div className="w-full max-w-7xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">
            Certificate Generator
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-blue-900">
              Login sebagai: <strong>{user.email}</strong>
            </p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex flex-col items-center min-h-screen bg-blue-50 text-blue-900 p-6 md:p-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Kolom Kiri: Panel Kontrol */}
          <div className="w-full p-8 space-y-6 bg-white rounded-2xl shadow-lg border border-blue-200">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold mb-2">
                Certificate Generator
              </h2>
              <p className="text-blue-600 text-lg">
                Atur dan buat sertifikat secara otomatis dengan mudah
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-2">
                  1. Upload Template
                </label>
                <label
                  htmlFor="file-upload"
                  className="w-full flex items-center justify-center px-5 py-7 border-2 border-dashed rounded-lg cursor-pointer bg-blue-100 border-blue-300 hover:border-blue-500 transition-colors"
                >
                  <div className="text-center">
                    <p className="text-sm text-blue-700">
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
                  className="block text-sm font-semibold text-blue-700 mb-2"
                >
                  2. Masukkan Nama (pisahkan koma)
                </label>
                <textarea
                  id="names"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md shadow-sm resize-none bg-blue-50 border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                />
              </div>
              <div className="space-y-5 pt-3">
                <h3 className="text-xl font-semibold text-blue-800">
                  3. Kustomisasi Teks
                </h3>
                <div>
                  <label
                    htmlFor="fontSize"
                    className="block text-sm font-semibold text-blue-700"
                  >
                    Ukuran Font: <span className="font-bold">{fontSize}px</span>
                  </label>
                  <input
                    id="fontSize"
                    type="range"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="fontFamily"
                      className="block text-sm font-semibold text-blue-700"
                    >
                      Jenis Font
                    </label>
                    <select
                      id="fontFamily"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option>Roboto</option>
                      <option>Montserrat</option>
                      <option>Playfair Display</option>
                      <option>Poppins</option>
                      <option>Lora</option>
                      <option>Pacifico</option>
                      <option>Caveat</option>
                      <option>Arial</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="textColor"
                      className="block text-sm font-semibold text-blue-700"
                    >
                      Warna Teks
                    </label>
                    <input
                      id="textColor"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full mt-1 h-10 p-1 border rounded-md cursor-pointer bg-white border-blue-300"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !templateFile}
              className="w-full flex items-center justify-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-300"
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
          <div className="w-full p-4 bg-white rounded-2xl shadow-lg flex items-center justify-center lg:h-full border border-blue-200">
            {previewUrl ? (
              <div
                ref={previewContainerRef}
                className="relative w-full max-w-[500px] aspect-[4/3] overflow-hidden border rounded-lg bg-blue-50"
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
              <div className="w-full max-w-[500px] aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center border-blue-300 bg-blue-50">
                <p className="font-semibold text-blue-700">
                  Pratinjau Template
                </p>
                <p className="text-sm text-blue-600">
                  Upload template untuk mengatur posisi teks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Daftar Hasil Generate */}
        <div className="w-full max-w-6xl mt-12">
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-blue-200">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">
              Hasil Generate Terbaru
            </h2>
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-blue-50"
                  >
                    <div>
                      <p className="font-semibold text-blue-900">
                        {cert.namaPeserta}
                      </p>
                      <p className="text-sm text-blue-700">
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
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Lihat
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-700">Belum ada sertifikat yang dibuat.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
