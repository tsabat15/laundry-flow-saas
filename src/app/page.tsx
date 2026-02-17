import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-display selection:bg-indigo-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        {/* PERBAIKAN: Mengurangi tinggi navbar di HP (h-16) dan padding */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="material-icons-outlined text-white text-lg sm:text-xl">local_laundry_service</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Laundry<span className="text-indigo-600">Flow</span></span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              Masuk
            </Link>
            {/* PERBAIKAN TOMBOL: text-xs, padding dikurangi, dan whitespace-nowrap agar tidak turun baris */}
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95 whitespace-nowrap">
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-bold mb-6 border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Sistem Kasir Cloud #1 untuk UMKM Laundry
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 sm:mb-8">
            Tinggalkan Nota Kertas. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              Otomatiskan Bisnis Anda.
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-500 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Software kasir pintar yang mengirim notifikasi WhatsApp otomatis ke pelanggan, mencegah kecurangan karyawan, dan memantau omzet dari HP Anda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-full shadow-xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
              Daftar Sekarang <span className="material-icons-outlined text-[18px] sm:text-[20px]">arrow_forward</span>
            </Link>
            <Link href="/login" className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 text-base sm:text-lg font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-full transition-all flex items-center justify-center">
              Login Pemilik
            </Link>
          </div>
        </div>
      </main>

      {/* FITUR UTAMA */}
      <section className="bg-white py-16 sm:py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Mengapa Pilih LaundryFlow?</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">Didesain khusus untuk menyelesaikan masalah harian pengusaha laundry.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Fitur 1 */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6">
                <span className="material-icons-outlined text-2xl sm:text-3xl">chat</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">WhatsApp Otomatis</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Pakaian selesai? Sistem otomatis mengirim pesan WA ke pelanggan agar rak laundry Anda cepat kosong dan uang cepat cair.
              </p>
            </div>

            {/* Fitur 2 */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6">
                <span className="material-icons-outlined text-2xl sm:text-3xl">security</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">Anti Kecurangan</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Setiap transaksi terekam di Cloud. Pantau omzet harian secara real-time dari HP Anda tanpa takut nota kertas hilang.
              </p>
            </div>

            {/* Fitur 3 */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6">
                <span className="material-icons-outlined text-2xl sm:text-3xl">storefront</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">White Label Toko</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Gunakan nama dan logo laundry Anda sendiri di dalam sistem dan cetakan struk untuk meningkatkan citra profesional bisnis Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-10 sm:py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="material-icons-outlined text-white text-sm">local_laundry_service</span>
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Laundry<span className="text-indigo-400">Flow</span></span>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm">© {new Date().getFullYear()} LaundryFlow SaaS. All rights reserved.</p>
        <p className="text-slate-600 text-[10px] sm:text-xs mt-2">Dibuat khusus untuk memajukan UMKM Indonesia.</p>
      </footer>

    </div>
  );
}