/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { auth, db } from "../../../lib/firebase"; 
import { useRouter } from "next/navigation";
import { collection, doc, updateDoc, onSnapshot, query, deleteDoc } from "firebase/firestore";

// 🔥 KEAMANAN TINGKAT TINGGI: DAFTAR ADMIN YANG DIIZINKAN (WHITELIST)
// GANTI EMAIL DI BAWAH INI DENGAN EMAIL ASLI AKUN ADMIN KAMU!
const ALLOWED_ADMINS = ["izuddintsabat@gmail.com", "kowalskihim@gmail.com"]; 

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false); // State untuk status izin

  // --- 🔒 PROTEKSI HALAMAN (SATFAM DIGITAL) ---
  useEffect(() => {
    if (loading) return; // Tunggu loading selesai

    // 1. Cek Login
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Cek Izin Admin (Whitelist)
    if (user.email && ALLOWED_ADMINS.includes(user.email)) {
      setIsAuthorized(true); // Izinkan masuk
    } else {
      // Jika bukan admin, tendang keluar!
      alert("⛔ AKSES DITOLAK: Anda tidak memiliki izin untuk mengakses halaman Super Admin.");
      router.push("/dashboard"); // Kembalikan ke dashboard klien biasa
    }
  }, [user, loading, router]);

  // --- AMBIL DATA KLIEN (HANYA JIKA DIIZINKAN) ---
  useEffect(() => {
    if (!user || !isAuthorized) return; // Jangan ambil data jika belum verifikasi admin

    const q = query(collection(db, "storeSettings"));
    const unsub = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        email: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
    });
    return () => unsub(); 
  }, [user, isAuthorized]);

  // --- LOGIKA HITUNG SISA HARI ---
  const getDaysRemaining = (expiryDateString: string) => {
    if (!expiryDateString) return -999; 
    const today = new Date();
    const expiry = new Date(expiryDateString);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Belum Aktif";
    return new Date(dateString).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // --- AKSI AKTIVASI & PERPANJANG LANGGANAN ---
  const extendSubscription = async (clientEmail: string, currentExpiry: string, isFirstTime: boolean = false) => {
    const msg = isFirstTime 
      ? `Aktivasi Pendaftar Baru: ${clientEmail} selama 30 hari?` 
      : `Terima pembayaran & perpanjang langganan ${clientEmail} selama 30 hari?`;

    if (window.confirm(msg)) {
      try {
        const today = new Date();
        let baseDate = currentExpiry ? new Date(currentExpiry) : today;
        if (baseDate < today) baseDate = today; // Jika sudah lewat/kosong, mulai dari hari ini

        baseDate.setDate(baseDate.getDate() + 30); // Tambah 30 hari

        await updateDoc(doc(db, "storeSettings", clientEmail), { 
          subscriptionUntil: baseDate.toISOString(),
          status: "AKTIF" // Otomatis ubah status jadi AKTIF (Hijau)
        });
        alert(isFirstTime ? "Lisensi Berhasil Diaktifkan!" : "Berhasil diperpanjang 30 Hari!");
      } catch (error) { alert("Gagal memproses."); }
    }
  };

  const changeClientStatus = async (clientEmail: string, newStatus: string) => {
    if (window.confirm(`Yakin ingin mengubah status ${clientEmail} menjadi ${newStatus}?`)) {
      try { await updateDoc(doc(db, "storeSettings", clientEmail), { status: newStatus }); } catch (error) { alert("Gagal mengubah status."); }
    }
  };

  const handleDeleteClient = async (clientEmail: string) => {
    if (window.confirm(`PERINGATAN FATAL: Yakin menghapus database toko ${clientEmail}?`)) {
      try { await deleteDoc(doc(db, "storeSettings", clientEmail)); } catch (error) { alert("Gagal menghapus."); }
    }
  };

  const handleLogout = async () => { await auth.signOut(); router.push("/login"); };

  // TAMPILAN LOADING (MENCEGAH FLASHING KONTEN SEBELUM DITENDANG)
  if (loading || !user || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="flex flex-col items-center gap-4"><span className="animate-spin material-icons-outlined text-4xl text-red-500">security</span><p className="text-slate-400 text-sm">Memverifikasi Izin Akses...</p></div></div>;

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "AKTIF").length;
  // 🟡 Hitung pendaftar baru
  const pendingClientsCount = clients.filter(c => c.status === "PENDING").length; 
  const estimatedRevenue = activeClients * 50000; 
  const displayedClients = clients.filter(c => c.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) || c.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-slate-900 font-display text-slate-200 antialiased flex min-h-screen">
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20"><span className="material-icons-outlined text-white text-[18px]">admin_panel_settings</span></div><span className="text-xl font-bold tracking-tight text-white">Laundry<span className="text-blue-500">Flow</span></span></div></div>
        <nav className="mt-4 flex-1"><div className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Manajemen SaaS</div><button className="w-full flex items-center px-6 py-3.5 bg-blue-600/10 text-blue-500 border-r-4 border-blue-500 transition-colors"><span className="material-icons-outlined mr-3 text-[20px]">group</span><span className="font-semibold text-sm">Daftar Klien</span></button></nav>
        <div className="p-6 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center justify-center text-sm font-bold text-slate-500 hover:text-red-400 transition-colors gap-2"><span className="material-icons-outlined text-[18px]">logout</span> Keluar</button></div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="p-8 xl:p-10 pb-0 mb-8 flex justify-between items-center">
          <div><h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Klien</h1><p className="text-slate-400 text-sm mt-1">Pantau pembayaran, masa aktif, dan aktivasi tenant baru.</p></div>
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700"><span className="material-icons-outlined text-slate-400">person</span></div><div className="hidden sm:block"><p className="text-sm font-bold text-white">CEO / Founder</p><p className="text-xs text-slate-500">{user.email}</p></div></div>
        </header>

        <div className="px-8 xl:px-10 pb-10 space-y-8">
          {/* METRIK REAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0"><span className="material-icons-outlined text-2xl">storefront</span></div><div><p className="text-sm text-slate-400 font-medium">Total Akun</p><p className="text-2xl font-bold text-white">{totalClients}</p></div></div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4"><div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0"><span className="material-icons-outlined text-2xl">verified</span></div><div><p className="text-sm text-slate-400 font-medium">Klien Aktif</p><p className="text-2xl font-bold text-white">{activeClients}</p></div></div>
            
            {/* 🟡 METRIK PENDAFTAR BARU */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-amber-700/50 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-2 top-2"><span className="material-icons-outlined text-amber-500/20 text-6xl">hourglass_empty</span></div>
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0 relative"><span className="material-icons-outlined text-2xl">person_add</span></div>
              <div className="relative">
                <p className="text-sm text-amber-400 font-bold uppercase tracking-widest">Antrean Baru</p>
                <p className="text-2xl font-bold text-white">{pendingClientsCount} <span className="text-sm font-normal text-slate-400">Toko</span></p>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4"><div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0"><span className="material-icons-outlined text-2xl">payments</span></div><div><p className="text-sm text-slate-400 font-medium">Estimasi MRR</p><p className="text-xl font-bold text-white">Rp {estimatedRevenue.toLocaleString('id-ID')}</p></div></div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4"><h2 className="font-bold text-lg text-white">Database Klien & Aktivasi</h2><div className="relative w-full sm:w-72"><span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span><input type="text" placeholder="Cari email / toko..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/></div></div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-900/50 border-b border-slate-700/50"><tr><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identitas Toko</th><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Sisa Masa Aktif</th><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Status Sistem</th><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi Super Admin</th></tr></thead>
                <tbody className="divide-y divide-slate-700/50">
                  {displayedClients.length === 0 ? (<tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">Belum ada data klien.</td></tr>) : (
                    displayedClients.map((client) => {
                      const daysLeft = getDaysRemaining(client.subscriptionUntil);
                      
                      // Cek apakah klien ini pendaftar baru
                      const isPending = client.status === "PENDING";

                      return (
                        <tr key={client.email} className={`transition-colors ${isPending ? 'bg-amber-900/10 hover:bg-amber-900/20' : 'hover:bg-slate-700/30'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {client.storeLogoUrl ? (<img src={client.storeLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white" />) : (<div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400"><span className="material-icons-outlined">store</span></div>)}
                              <div>
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                  {client.storeName || "Belum Diatur"} 
                                  {/* Label Klien Baru */}
                                  {isPending && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest border border-amber-500/50">Pendaftar Baru</span>}
                                </p>
                                <p className="text-xs text-slate-400">{client.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {daysLeft === -999 ? (
                              <span className="text-slate-500 text-xs italic">Menunggu Pembayaran</span>
                            ) : (
                              <div>
                                <p className={`text-sm font-bold ${daysLeft < 0 ? 'text-red-400' : (daysLeft <= 3 ? 'text-amber-400' : 'text-emerald-400')}`}>{daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} Hari` : `${daysLeft} Hari Lagi`}</p>
                                <p className="text-[10px] text-slate-500">{formatDate(client.subscriptionUntil)}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {/* Jika Pending, kita kunci opsi ubah manual. Hanya bisa lewat tombol Aktivasi */}
                            {isPending ? (
                              <span className="inline-flex items-center bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2 animate-pulse"></span> PENDING</span>
                            ) : (
                              <select value={client.status || "AKTIF"} onChange={(e) => changeClientStatus(client.email, e.target.value)} className={`bg-slate-900 border text-xs font-bold rounded-lg px-2 py-1.5 outline-none cursor-pointer ${client.status === 'BLOKIR' ? 'border-red-500 text-red-400' : (client.status === 'TUNGGAKAN' ? 'border-amber-500 text-amber-400' : 'border-emerald-500 text-emerald-400')}`}>
                                <option value="AKTIF">🟢 Aktif</option>
                                <option value="TUNGGAKAN">🟠 Tunggakan</option>
                                <option value="BLOKIR">🔴 Blokir</option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* 🟢 TOMBOL AKTIVASI KHUSUS PENDAFTAR BARU */}
                              {isPending ? (
                                <button onClick={() => extendSubscription(client.email, client.subscriptionUntil, true)} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-lg shadow-amber-500/20">
                                  <span className="material-icons-outlined text-[16px]">how_to_reg</span> AKTIFKAN LISENSI
                                </button>
                              ) : (
                                <button onClick={() => extendSubscription(client.email, client.subscriptionUntil, false)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/20">
                                  <span className="material-icons-outlined text-[14px]">calendar_month</span> +30 Hari
                                </button>
                              )}
                              <button onClick={() => handleDeleteClient(client.email)} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-lg transition-all"><span className="material-icons-outlined text-[16px]">delete</span></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}