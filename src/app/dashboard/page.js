"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Draggable from "react-draggable";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Komponen Spinner
const Spinner = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
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

// Komponen Notifikasi
const Notification = ({ message, type, show }) => {
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
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State utama
  const [templateFile, setTemplateFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // State untuk Teks Utama (Nama)
  const [names, setNames] = useState("Andi Budi, Candra Dwi");
  const [positionPercent, setPositionPercent] = useState({ x: 0.5, y: 0.5 });
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [textColor, setTextColor] = useState("#333333");

  // State untuk Teks Sekunder (Jabatan, dll.)
  const [showSecondaryControls, setShowSecondaryControls] = useState(false);
  const [secondaryText, setSecondaryText] = useState(
    "Peserta Webinar, Juara 1"
  );
  const [secondaryPositionPercent, setSecondaryPositionPercent] = useState({
    x: 0.5,
    y: 0.6
  });
  const [secondaryFontSize, setSecondaryFontSize] = useState(24);
  const [secondaryFontFamily, setSecondaryFontFamily] = useState("Roboto");
  const [secondaryTextColor, setSecondaryTextColor] = useState("#555555");

  // State untuk Pagination & Download
  const [certificates, setCertificates] = useState([]);
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // State untuk Batch Processing
  const [progress, setProgress] = useState(null);

  const nodeRef = useRef(null);
  const secondaryNodeRef = useRef(null);
  const previewContainerRef = useRef(null);

  // Efek untuk notifikasi
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(
        () => setNotification({ ...notification, show: false }),
        4000
      );
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Efek untuk melindungi halaman
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fungsi untuk mengambil halaman pertama sertifikat
  const fetchInitialCertificates = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Gagal mengambil data dari server.");
      const data = await response.json();
      setCertificates(data.certificates);
      setLastDocId(data.lastDocId);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Gagal mengambil daftar sertifikat:", error);
    }
  }, [user]);

  // Fungsi untuk memuat halaman sertifikat berikutnya
  const handleLoadMore = async () => {
    if (!user || !lastDocId || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/certificates?lastVisible=${lastDocId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error("Gagal memuat data selanjutnya.");
      const data = await response.json();
      setCertificates((prev) => [...prev, ...data.certificates]);
      setLastDocId(data.lastDocId);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Gagal memuat lebih banyak sertifikat:", error);
      setNotification({ show: true, message: error.message, type: "error" });
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInitialCertificates();
    }
  }, [user, fetchInitialCertificates]);

  // Fungsi Generate dengan Batch Processing (Chunking)
  const handleGenerate = async () => {
    if (!templateFile || !user) {
      const message = !templateFile
        ? "Pilih file template dulu!"
        : "Sesi tidak valid.";
      setNotification({ show: true, message, type: "error" });
      if (!user) router.push("/login");
      return;
    }

    setIsLoading(true);
    const allNames = names
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n);
    const allSecondaryTexts = secondaryText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const CHUNK_SIZE = 50;
    setProgress({ current: 0, total: allNames.length });

    try {
      const token = await user.getIdToken();

      for (let i = 0; i < allNames.length; i += CHUNK_SIZE) {
        const nameChunk = allNames.slice(i, i + CHUNK_SIZE);
        const secondaryTextChunk = allSecondaryTexts.slice(i, i + CHUNK_SIZE);

        setProgress({ current: i, total: allNames.length });

        const formData = new FormData();
        formData.append("template", templateFile);
        formData.append("previewWidth", previewSize.width);

        formData.append("namesField", nameChunk.join(", "));
        formData.append("positionXPercent", positionPercent.x);
        formData.append("positionYPercent", positionPercent.y);
        formData.append("fontSize", fontSize);
        formData.append("fontFamily", fontFamily);
        formData.append("textColor", textColor);

        if (showSecondaryControls && secondaryTextChunk.length > 0) {
          formData.append("secondaryTextField", secondaryTextChunk.join(", "));
          formData.append(
            "secondaryPositionXPercent",
            secondaryPositionPercent.x
          );
          formData.append(
            "secondaryPositionYPercent",
            secondaryPositionPercent.y
          );
          formData.append("secondaryFontSize", secondaryFontSize);
          formData.append("secondaryFontFamily", secondaryFontFamily);
          formData.append("secondaryTextColor", secondaryTextColor);
        }

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(
            result.message || `Gagal pada batch #${i / CHUNK_SIZE + 1}`
          );
        }
      }

      setProgress({ current: allNames.length, total: allNames.length });
      setNotification({
        show: true,
        message: "Sukses! Semua sertifikat berhasil dibuat.",
        type: "success"
      });

      setCertificates([]);
      setLastDocId(null);
      setHasMore(true);
      fetchInitialCertificates();
    } catch (error) {
      setNotification({
        show: true,
        message: `Gagal: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Fungsi Download
  const handleDownloadSingle = async (url, name) => {
    try {
      setNotification({
        show: true,
        message: `Mengunduh ${name}...`,
        type: "success"
      });
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, `sertifikat-${name.replace(/\s+/g, "-")}.png`);
    } catch (error) {
      console.error("Download error:", error);
      setNotification({
        show: true,
        message: `Gagal mengunduh: ${error.message}`,
        type: "error"
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!user) {
      setNotification({
        show: true,
        message: "Sesi tidak valid.",
        type: "error"
      });
      return;
    }

    if (certificates.length === 0) {
      setNotification({
        show: true,
        message: "Tidak ada sertifikat untuk diunduh.",
        type: "error"
      });
      return;
    }

    setIsZipping(true);
    setNotification({
      show: true,
      message: "Server sedang mempersiapkan file ZIP Anda...",
      type: "success"
    });

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/zip-certificates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal membuat file ZIP.");
      }

      // Langsung buka URL yang diberikan server. Browser akan otomatis mengunduhnya.
      setNotification({
        show: true,
        message: "Unduhan Anda akan segera dimulai!",
        type: "success"
      });
      window.open(result.zipUrl, "_blank");
    } catch (error) {
      console.error("Zip error:", error);
      setNotification({
        show: true,
        message: `Gagal membuat ZIP: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsZipping(false);
    }
  };

  // Fungsi Logout dan handler lainnya
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const handlecreatedesign = async () => {
    router.push("/create-design");
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setPositionPercent({ x: 0.5, y: 0.5 });
      setSecondaryPositionPercent({ x: 0.5, y: 0.6 });
    }
  };

  const createDragHandler = (setter) => (e, ui) => {
    const container = previewContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const textElement = ui.node;
    const newX = ui.x + textElement.offsetWidth / 2;
    const newY = ui.y + textElement.offsetHeight / 2;
    setter({ x: newX / width, y: newY / height });
  };

  const handlePrimaryDrag = createDragHandler(setPositionPercent);
  const handleSecondaryDrag = createDragHandler(setSecondaryPositionPercent);

  useEffect(() => {
    const updatePreviewSize = () => {
      if (previewContainerRef.current) {
        const { width, height } =
          previewContainerRef.current.getBoundingClientRect();
        setPreviewSize({ width, height });
      }
    };
    updatePreviewSize();
    window.addEventListener("resize", updatePreviewSize);
    return () => window.removeEventListener("resize", updatePreviewSize);
  }, [previewUrl]);

  useEffect(() => {
    const url = previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [previewUrl]);

  const calculatePixelPosition = (pos, ref) => ({
    x: previewSize.width * pos.x - (ref.current?.offsetWidth / 2 || 0),
    y: previewSize.height * pos.y - (ref.current?.offsetHeight / 2 || 0)
  });

  const pixelPosition = calculatePixelPosition(positionPercent, nodeRef);
  const secondaryPixelPosition = calculatePixelPosition(
    secondaryPositionPercent,
    secondaryNodeRef
  );

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <Spinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Notification {...notification} />
      <header className="w-full bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center px-6 py-3">
          {/* Sisi Kiri: Judul */}
          <h1 className="text-xl font-bold text-indigo-700 tracking-tight">
            SertiGen Dashboard
          </h1>

          {/* SISI KANAN: Kumpulan Aksi (Tombol & User Info) */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlecreatedesign} // Pastikan nama fungsi ini sudah benar
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 flex items-center gap-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Buat Desain Baru</span>
            </button>

            {/* Pembatas Visual */}
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            <div className="hidden md:flex items-center gap-4">
              <p className="text-sm text-slate-500">
                Login sebagai:{" "}
                <strong className="font-medium text-slate-700">
                  {user.email}
                </strong>
              </p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 hover:text-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-col items-center min-h-screen bg-blue-50 p-4 md:p-8 text-blue-900">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full p-8 space-y-6 bg-white rounded-2xl shadow-lg border border-blue-200">
            <h2 className="text-3xl font-bold text-center text-blue-800">
              Kontrol Generator
            </h2>
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                1. Unggah Template
              </label>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="w-full flex justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer bg-blue-100 border-blue-300 hover:border-blue-500"
              >
                <span className="text-sm text-blue-700">
                  {templateFile
                    ? `Ganti: ${templateFile.name}`
                    : "Pilih file template"}
                </span>
              </label>
            </div>

            <div className="space-y-4 pt-4 border-t border-blue-200">
              <h3 className="text-lg font-medium text-blue-800">
                Teks Utama (Nama Peserta)
              </h3>
              <textarea
                id="names"
                rows={3}
                className="w-full p-2 border rounded-md bg-blue-50 border-blue-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: Budi Santoso, Citra Lestari, Rian Adriansyah"
                value={names}
                onChange={(e) => setNames(e.target.value)}
              />

              {/* KETERANGAN YANG LEBIH DESKRIPTIF */}
              <p className="text-xs text-slate-500 mt-1">
                * Masukkan satu atau beberapa nama, pisahkan dengan koma (,).
              </p>

              <div>
                <label
                  htmlFor="fontSize"
                  className="block text-sm font-medium text-blue-700"
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
                  className="w-full"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-blue-200">
              <button
                onClick={() => setShowSecondaryControls(!showSecondaryControls)}
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                {showSecondaryControls
                  ? "Hilangkan Teks Kedua"
                  : "Tambah Baris Teks Kedua (misal: Jabatan)"}
              </button>
              {showSecondaryControls && (
                <div className="mt-4 space-y-4 p-4 bg-blue-100 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-800">
                    Teks Kedua
                  </h3>
                  <textarea
                    id="secondaryText"
                    placeholder="Contoh: Peserta Webinar, Juara 1"
                    rows={2}
                    className="w-full p-2 border rounded-md bg-blue-50 border-blue-300 focus:ring-blue-500 focus:border-blue-500"
                    value={secondaryText}
                    onChange={(e) => setSecondaryText(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-blue-700">
                      Ukuran Font:{" "}
                      <span className="font-bold">{secondaryFontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={secondaryFontSize}
                      onChange={(e) => setSecondaryFontSize(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={secondaryFontFamily}
                      onChange={(e) => setSecondaryFontFamily(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white border-blue-300 focus:ring-blue-500 focus:border-blue-500"
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
                    <input
                      type="color"
                      value={secondaryTextColor}
                      onChange={(e) => setSecondaryTextColor(e.target.value)}
                      className="w-full h-10 p-1 border rounded-md bg-white border-blue-300"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-blue-200">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !templateFile}
                className="w-full flex justify-center p-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Spinner /> : "Generate Sertifikat"}
              </button>
              {progress && (
                <div className="mt-4">
                  <p className="text-sm text-center text-blue-700">
                    Memproses {progress.current} dari {progress.total}{" "}
                    sertifikat...
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full p-4 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-blue-200">
            {previewUrl ? (
              <div
                ref={previewContainerRef}
                className="relative w-full max-w-[500px] aspect-video overflow-hidden border rounded-lg border-blue-200"
              >
                <img
                  src={previewUrl}
                  alt="Template Preview"
                  className="w-full h-full object-contain"
                />
                <Draggable
                  nodeRef={nodeRef}
                  bounds="parent"
                  position={pixelPosition}
                  onStop={handlePrimaryDrag}
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
                        fontWeight: "bold"
                      }}
                    >
                      Nama Peserta
                    </span>
                  </div>
                </Draggable>
                {showSecondaryControls && (
                  <Draggable
                    nodeRef={secondaryNodeRef}
                    bounds="parent"
                    position={secondaryPixelPosition}
                    onStop={handleSecondaryDrag}
                  >
                    <div
                      ref={secondaryNodeRef}
                      className="cursor-move absolute p-2"
                      style={{ top: 0, left: 0, whiteSpace: "nowrap" }}
                    >
                      <span
                        style={{
                          color: secondaryTextColor,
                          fontSize: `${secondaryFontSize}px`,
                          fontFamily: secondaryFontFamily,
                          fontWeight: "bold"
                        }}
                      >
                        Teks Kedua
                      </span>
                    </div>
                  </Draggable>
                )}
              </div>
            ) : (
              <div className="w-full max-w-[500px] aspect-video flex justify-center items-center border-2 border-dashed rounded-lg border-blue-300 bg-blue-50">
                <p className="text-blue-700">Pratinjau Template</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-6xl mt-12">
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-blue-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900">
                Hasil Generate Terbaru
              </h2>
              <button
                onClick={handleDownloadAll}
                disabled={isZipping || certificates.length === 0}
                className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isZipping ? <Spinner className="w-4 h-4" /> : null}
                {isZipping ? "Zipping..." : "Download Semua"}
              </button>
            </div>

            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-blue-100"
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
                    <button
                      onClick={() =>
                        handleDownloadSingle(
                          cert.urlSertifikat,
                          cert.namaPeserta
                        )
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-700">Belum ada sertifikat yang dibuat.</p>
            )}

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition-colors"
                >
                  {isLoadingMore ? "Memuat..." : "Muat Lebih Banyak"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
