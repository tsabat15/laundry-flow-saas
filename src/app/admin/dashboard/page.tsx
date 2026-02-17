"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { auth, db } from "../../../lib/firebase"; 
import { useRouter } from "next/navigation";
import { collection, doc, updateDoc, onSnapshot, query } from "firebase/firestore";

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State Data Klien
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Proteksi Halaman Admin
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    // Opsional: Kamu bisa tambahkan logika jika email user BUKAN email admin kamu, tendang ke luar.
    // if (user && user.email !== "rhey.admin@gmail.com") router.push("/dashboard");
  }, [user, loading, router]);

  // Ambil semua data toko dari Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "storeSettings"));
    const unsub = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        email: doc.id, // Email owner adalah ID dokumen
        ...doc.data()
      }));
      setClients(clientsData);
    });

    return () => unsub(); 
  }, [user]);

  // Fungsi "SATPAM" - Mengubah status berlangganan klien
  const toggleClientStatus = async (clientEmail: string, currentStatus: string) => {
    const newStatus = currentStatus === "AKTIF" ? "NUNGGAK" : "AKTIF";
    const confirmMessage = currentStatus === "AKTIF" 
      ? `Yakin ingin MENANGGUHKAN akses toko milik ${clientEmail}?` 
      : `Yakin ingin MENGAKTIFKAN kembali toko milik ${clientEmail}?`;

    if (window.confirm(confirmMessage)) {
      try {
        await updateDoc(doc(db, "storeSettings", clientEmail), {
          status: newStatus
        });
      } catch (error) {
        alert("Gagal mengubah status klien.");
      }
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><span className="animate-spin material-icons-outlined text-4xl text-blue-500">autorenew</span></div>;

  // Kalkulasi Metrik
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "AKTIF").length;
  const suspendedClients = clients.filter(c => c.status === "NUNGGAK").length;

  const displayedClients = clients.filter(c => 
    c.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 font-display text-slate-200 antialiased flex min-h-screen">
      
      {/* SIDEBAR ADMIN (Gelap & Elegan) */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="material-icons-outlined text-white text-[18px]">admin_panel_settings</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Super<span className="text-blue-500">Admin</span></span>
          </div>
        </div>
        <nav className="mt-4 flex-1">
          <div className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Manajemen SaaS</div>
          <button className="w-full flex items-center px-6 py-3.5 bg-blue-600/10 text-blue-500 border-r-4 border-blue-500 transition-colors">
            <span className="material-icons-outlined mr-3 text-[20px]">group</span><span className="font-semibold text-sm">Daftar Klien</span>
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
           <button onClick={handleLogout} className="w-full flex items-center justify-center text-sm font-bold text-slate-500 hover:text-red-400 transition-colors gap-2">
             <span className="material-icons-outlined text-[18px]">logout</span> Keluar
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="p-8 xl:p-10 pb-0 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Klien</h1>
            <p className="text-slate-400 text-sm mt-1">Pantau dan kelola status berlangganan tenant SaaS Anda.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
               <span className="material-icons-outlined text-slate-400">person</span>
             </div>
             <div className="hidden sm:block">
               <p className="text-sm font-bold text-white">CEO / Founder</p>
               <p className="text-xs text-slate-500">{user.email}</p>
             </div>
          </div>
        </header>

        <div className="px-8 xl:px-10 pb-10 space-y-8">
          
          {/* METRIK KINERJA SAAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-icons-outlined text-2xl">storefront</span>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Tenant / Toko</p>
                <p className="text-2xl font-bold text-white">{totalClients}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-icons-outlined text-2xl">verified</span>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Klien Aktif (Bayar)</p>
                <p className="text-2xl font-bold text-white">{activeClients}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-icons-outlined text-2xl">block</span>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Akses Ditangguhkan</p>
                <p className="text-2xl font-bold text-white">{suspendedClients}</p>
              </div>
            </div>
          </div>

          {/* TABEL MANAJEMEN KLIEN */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="font-bold text-lg text-white">Database Klien</h2>
              <div className="relative w-full sm:w-72">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                <input type="text" placeholder="Cari email atau nama toko..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"/>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identitas Toko</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akun Owner</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Status Akses</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi (Satpam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {displayedClients.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">Belum ada data klien.</td></tr>
                  ) : (
                    displayedClients.map((client) => (
                      <tr key={client.email} className="hover:bg-slate-700/30 transition-colors">
                        
                        {/* Kolom Nama Toko & Logo */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {client.storeLogoUrl ? (
                              <img src={client.storeLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                <span className="material-icons-outlined">store</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-white">{client.storeName || "Belum Diatur"}</p>
                              <p className="text-xs text-slate-400">{client.storePhone || "-"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Kolom Email Owner */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-300 flex items-center gap-1">
                            <span className="material-icons-outlined text-[16px] text-slate-500">email</span> {client.email}
                          </p>
                        </td>

                        {/* Kolom Status Badge */}
                        <td className="px-6 py-4 text-center">
                          {client.status === "AKTIF" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Nunggak
                            </span>
                          )}
                        </td>

                        {/* Kolom Aksi Toggle */}
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleClientStatus(client.email, client.status || "AKTIF")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-end gap-2 ml-auto shadow-sm ${
                              client.status === "AKTIF" 
                                ? 'bg-slate-700 hover:bg-red-500 text-white' 
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                            }`}
                          >
                            {client.status === "AKTIF" ? (
                              <><span className="material-icons-outlined text-[16px]">block</span> Bekukan Akses</>
                            ) : (
                              <><span className="material-icons-outlined text-[16px]">check_circle</span> Buka Akses</>
                            )}
                          </button>
                        </td>

                      </tr>
                    ))
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