import Link from "next/link";

// Komponen ikon untuk bagian fitur
const FeatureIcon = ({ children }) => (
  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-md">
    {children}
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="w-full sticky top-0 bg-white/70 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight">
            SertiGen
          </h1>
          <nav className="space-x-2 md:space-x-4">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
              Daftar Gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center bg-gradient-to-br from-indigo-50 to-white">
          <div className="container mx-auto text-center px-6 py-20 md:py-28">
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900">
              Buat Ribuan Sertifikat Personal
              <span className="block text-indigo-600 mt-2">
                dalam Hitungan Menit
              </span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Ucapkan selamat tinggal pada proses desain manual. Cukup unggah
              template, masukkan daftar nama, dan biarkan SertiGen mencetak
              sertifikat profesional secara otomatis.
            </p>
            <div className="mt-10">
              <Link
                href="/register"
                className="px-8 py-4 font-semibold text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 hover:scale-105 transform transition"
              >
                Mulai Membuat, Gratis!
              </Link>
            </div>
          </div>
        </section>

        {/* Fitur Unggulan */}
        <section id="features" className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900">
                Kenapa Memilih SertiGen?
              </h3>
              <p className="mt-4 text-gray-600 max-w-xl mx-auto">
                Alat yang Anda butuhkan untuk efisiensi kerja tanpa kompromi
                pada kualitas.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                {
                  title: "Cepat & Efisien",
                  desc: "Proses ratusan nama hanya dalam sekali klik, bukan berjam-jam kerja manual.",
                  icon: (
                    <>
                      <path d="m12 14 4-4" />
                      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                    </>
                  )
                },
                {
                  title: "Kustomisasi Mudah",
                  desc: "Atur posisi nama, ukuran, jenis, dan warna font dengan pratinjau interaktif.",
                  icon: (
                    <path d="M12 15-3.4 4.2c-.5-.8-1.5-.8-2-.1l-.8.8c-.5.7-.5 1.7 0 2.4l13.2 13.2c.7.7 1.7.7 2.4 0l.8-.8c.7-.5.7-1.5-.1-2Z" />
                  )
                },
                {
                  title: "Kualitas Profesional",
                  desc: "Ekspor sertifikat dalam format PNG resolusi tinggi, siap dibagikan digital.",
                  icon: (
                    <>
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="m12 9 1.8 3.6a.5.5 0 0 0 .8.4l3.6 1.8-3.6 1.8a.5.5 0 0 0-.8.4L12 21l-1.8-3.6a.5.5 0 0 0-.8-.4L5.8 15l3.6-1.8a.5.5 0 0 0 .8-.4Z" />
                    </>
                  )
                },
                {
                  title: "Siap Cetak & Digital",
                  desc: "File PNG tajam saat dicetak dan sempurna untuk dibagikan online.",
                  icon: (
                    <>
                      <path d="M6 18h12a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z" />
                      <path d="M6 9V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
                      <path d="M10 12h4" />
                    </>
                  )
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-8 bg-slate-50 rounded-2xl shadow-sm hover:shadow-md transition"
                >
                  <FeatureIcon>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {item.icon}
                    </svg>
                  </FeatureIcon>
                  <h4 className="mt-6 text-xl font-semibold">{item.title}</h4>
                  <p className="mt-2 text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cara Kerja */}
        <section id="how-it-works" className="py-20 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900">
                Hanya 3 Langkah Mudah
              </h3>
              <p className="mt-4 text-gray-600 max-w-xl mx-auto">
                Mulai dari template hingga sertifikat jadi dalam sekejap.
              </p>
            </div>
            <div className="relative">
              <div
                className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-indigo-100"
                aria-hidden="true"
              />
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16">
                {[
                  {
                    step: "01",
                    title: "Unggah Template",
                    desc: "Gunakan desain sertifikat Anda dalam format JPG atau PNG."
                  },
                  {
                    step: "02",
                    title: "Masukkan Nama",
                    desc: "Salin-tempel daftar nama, lalu sesuaikan posisi dan gaya teks."
                  },
                  {
                    step: "03",
                    title: "Generate & Unduh",
                    desc: "Klik 'Generate' dan semua sertifikat siap diunduh."
                  }
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-md border border-indigo-100 text-2xl font-bold text-indigo-600">
                      {s.step}
                    </div>
                    <h4 className="mt-6 text-xl font-semibold">{s.title}</h4>
                    <p className="mt-2 text-gray-600">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="container mx-auto text-center px-6 py-20">
            <h3 className="text-3xl md:text-4xl font-bold">
              Siap Mengubah Cara Anda Membuat Sertifikat?
            </h3>
            <p className="mt-4 text-indigo-200 max-w-xl mx-auto">
              Daftar sekarang dan rasakan kemudahan manajemen sertifikat di
              ujung jari Anda. Gratis untuk memulai!
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="px-8 py-4 font-semibold text-indigo-600 bg-white rounded-xl shadow-lg hover:bg-gray-100 hover:scale-105 transform transition"
              >
                Coba SertiGen Sekarang
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-50 border-t">
        <div className="container mx-auto p-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} SertiGen. Hak Cipta Dilindungi.
        </div>
      </footer>
    </div>
  );
}
