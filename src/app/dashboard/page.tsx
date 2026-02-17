"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../lib/firebase"; 
import { useRouter } from "next/navigation";
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, onSnapshot, query, where, orderBy, serverTimestamp } from "firebase/firestore";

const DEFAULT_SERVICES = [
  { id: "svc_1", name: "Cuci Saja", price: 8000, type: "load", capacity: 10, unit: "10 Kg", icon: "local_washing_machine", minOrder: 1, roundUp: false },
  { id: "svc_2", name: "Cuci Setrika", price: 5000, type: "kg", capacity: 1, unit: "Kg", icon: "waves", minOrder: 3, roundUp: true },
  { id: "svc_3", name: "Setrika Saja", price: 4000, type: "kg", capacity: 1, unit: "Kg", icon: "iron", minOrder: 1, roundUp: false },
  { id: "svc_4", name: "Cuci Satuan", price: 15000, type: "pcs", capacity: 1, unit: "Pcs", icon: "checkroom", minOrder: 1, roundUp: false }
];
const DEFAULT_ADDONS = [
  { id: "add_1", name: "Ekstra Wangi", price: 2000 },
  { id: "add_2", name: "Pisah Luntur", price: 5000 },
];

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentView, setCurrentView] = useState("dashboard"); 
  const [activeTab, setActiveTab] = useState("proses");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState<any[]>([]);
  const [storeServices, setStoreServices] = useState<any[]>([]);
  const [storeAddons, setStoreAddons] = useState<any[]>([]);
  
  const [storeName, setStoreName] = useState("LaundryFlow");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [storeStatus, setStoreStatus] = useState("AKTIF"); 
  const [fonnteToken, setFonnteToken] = useState("");
  
  const [inputStoreName, setInputStoreName] = useState("");
  const [inputStoreAddress, setInputStoreAddress] = useState("");
  const [inputStorePhone, setInputStorePhone] = useState("");
  const [inputStoreLogoUrl, setInputStoreLogoUrl] = useState("");
  const [inputToken, setInputToken] = useState(""); 
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState<number | "">("");
  const [isExpress, setIsExpress] = useState(false);
  const [inputValue, setInputValue] = useState<number | "">(1); 
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showManualAddon, setShowManualAddon] = useState(false);
  const [manualAddonName, setManualAddonName] = useState("");
  const [manualAddonPrice, setManualAddonPrice] = useState<number | "">("");
  const [customAddonsList, setCustomAddonsList] = useState<{id: string, name: string, price: number}[]>([]);

  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  const [newSvcType, setNewSvcType] = useState("kg"); 
  const [newSvcCap, setNewSvcCap] = useState("10");
  const [newSvcMinOrder, setNewSvcMinOrder] = useState("1"); 
  const [newSvcRoundUp, setNewSvcRoundUp] = useState(false); 

  const [broadcastMessage, setBroadcastMessage] = useState("Halo Kak [Nama],\n\nKami ada promo spesial nih dari toko kami! Diskon 20% untuk cuci bedcover minggu ini.\n\nDitunggu kedatangannya ya!\n\n*Balas STOP untuk berhenti menerima info promo.");
  const [selectedMarketingCustomers, setSelectedMarketingCustomers] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.email) return;
    
    // PERBAIKAN: Meyakinkan TypeScript bahwa userEmail adalah string
    const userEmail = user.email as string;

    const qOrders = query(collection(db, "orders"), where("userEmail", "==", userEmail), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, "storeSettings", userEmail), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreServices(data.services || DEFAULT_SERVICES);
        setStoreAddons(data.addons || DEFAULT_ADDONS);
        setFonnteToken(data.fonnteToken || "");
        setInputToken(data.fonnteToken || "");
        setStoreName(data.storeName || "LaundryFlow");
        setInputStoreName(data.storeName || "LaundryFlow");
        setStoreAddress(data.storeAddress || "");
        setInputStoreAddress(data.storeAddress || "");
        setStorePhone(data.storePhone || "");
        setInputStorePhone(data.storePhone || "");
        setStoreLogoUrl(data.storeLogoUrl || "");
        setInputStoreLogoUrl(data.storeLogoUrl || "");
        setStoreStatus(data.status || "AKTIF");

        if(data.services && data.services.length > 0 && !selectedServiceId) setSelectedServiceId(data.services[0].id);
      } else {
        setDoc(doc(db, "storeSettings", userEmail), { 
          services: DEFAULT_SERVICES, addons: DEFAULT_ADDONS, storeName: "Laundry Baru", status: "AKTIF"
        }, { merge: true });
      }
    });

    return () => { unsubOrders(); unsubSettings(); }; 
  }, [user]);

  const handleImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("Tolong masukkan file berupa gambar (JPG/PNG)."); return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300; let width = img.width; let height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/webp", 0.8);
        setInputStoreLogoUrl(compressedBase64);
      };
    };
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleImageFile(e.dataTransfer.files[0]); };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) handleImageFile(e.target.files[0]); };

  const handleSaveStoreBranding = async () => {
    try {
      await setDoc(doc(db, "storeSettings", user?.email || "unknown"), { 
        storeName: inputStoreName, storeAddress: inputStoreAddress, storePhone: inputStorePhone, storeLogoUrl: inputStoreLogoUrl, fonnteToken: inputToken
      }, { merge: true });
      alert("Pengaturan Toko berhasil diperbarui!");
    } catch (error) { alert("Gagal menyimpan."); }
  };

  const handleAddNewService = async () => { 
    if (!newSvcName || !newSvcPrice) { alert("Nama dan Harga layanan harus diisi!"); return; }
    let assignedIcon = newSvcType === 'load' ? "local_washing_machine" : (newSvcType === 'pcs' ? "checkroom" : "waves");
    const newService = { id: "svc_" + Date.now(), name: newSvcName, price: Number(newSvcPrice), type: newSvcType, capacity: newSvcType === 'load' ? Number(newSvcCap) : 1, unit: newSvcType === 'load' ? `${newSvcCap} Kg` : (newSvcType === 'pcs' ? 'Pcs' : 'Kg'), icon: assignedIcon, minOrder: Number(newSvcMinOrder) || 1, roundUp: newSvcRoundUp };
    const updatedServices = [...storeServices, newService];
    await setDoc(doc(db, "storeSettings", user?.email || "unknown"), { services: updatedServices }, { merge: true });
    setNewSvcName(""); setNewSvcPrice(""); setNewSvcType("kg"); setNewSvcCap("10"); setNewSvcMinOrder("1"); setNewSvcRoundUp(false);
  };
  const handleDeleteService = async (id: string) => { 
    if (window.confirm("Yakin ingin menghapus layanan ini?")) {
      const updatedServices = storeServices.filter(s => s.id !== id);
      await setDoc(doc(db, "storeSettings", user?.email || "unknown"), { services: updatedServices }, { merge: true });
    }
  };

  const uniqueCustomers = Array.from(new Map(orders.filter(o => o.customerPhone && o.customerPhone.trim() !== "").map(o => [o.customerPhone, { name: o.customer, phone: o.customerPhone }])).values());

  const handleSelectAllMarketing = () => {
    if (selectedMarketingCustomers.length === uniqueCustomers.length) setSelectedMarketingCustomers([]); 
    else setSelectedMarketingCustomers(uniqueCustomers.map(c => c.phone)); 
  };

  const handleToggleMarketingCustomer = (phone: string) => {
    setSelectedMarketingCustomers(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  };

  const handleSendBroadcast = async () => {
    if (selectedMarketingCustomers.length === 0) { alert("Pilih minimal 1 pelanggan!"); return; }
    if (!fonnteToken) { alert("Token Fonnte belum diatur."); return; }
    if (!broadcastMessage.trim()) { alert("Pesan tidak boleh kosong!"); return; }

    if (window.confirm(`Kirim broadcast ke ${selectedMarketingCustomers.length} pelanggan?`)) {
      setIsBroadcasting(true); setBroadcastProgress(0);
      const targets = uniqueCustomers.filter(c => selectedMarketingCustomers.includes(c.phone));
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        let phone = target.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1); else if (!phone.startsWith('62')) phone = '62' + phone;
        const finalMessage = broadcastMessage.replace(/\[Nama\]/g, target.name).replace(/\[Toko\]/g, storeName);
        try {
          await fetch("https://api.fonnte.com/send", { method: "POST", headers: { "Authorization": fonnteToken }, body: new URLSearchParams({ target: phone, message: finalMessage, delay: '2', countryCode: '62' }) });
        } catch (error) { console.error("Gagal", target.name); }
        setBroadcastProgress(i + 1);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      alert("Broadcast Selesai!"); setIsBroadcasting(false); setSelectedMarketingCustomers([]);
    }
  };

  const sendWhatsAppNotification = async (order: any) => {
    if (!order.customerPhone) { alert("Maaf, nomor telepon pelanggan tidak tersimpan."); return; }
    let phone = order.customerPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1); else if (!phone.startsWith('62')) phone = '62' + phone;

    const message = `Halo Kak *${order.customer}*,\n\nCucian Anda dengan No. Nota *${order.invoiceId}* di *${storeName}* saat ini sudah *SIAP DIAMBIL*.\n\nLayanan: ${order.service}\nTotal Tagihan: *${formatRp(order.totalPrice || 0)}*\n\nTerima kasih! 🙏`;

    if (!fonnteToken) {
      alert("Token API Fonnte belum diatur. Menggunakan mode manual WA.");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank'); return;
    }
    try {
      const response = await fetch("https://api.fonnte.com/send", { method: "POST", headers: { "Authorization": fonnteToken }, body: new URLSearchParams({ target: phone, message: message, delay: '2', countryCode: '62' }) });
      const result = await response.json();
      if (result.status) alert("Pesan WhatsApp berhasil dikirim otomatis!"); else alert("Gagal mengirim WA: " + result.reason);
    } catch (error) { alert("Terjadi kesalahan sistem saat menghubungi WA."); }
  };

  const handleStatusChange = async (firebaseId: string, currentOrder: any, newStatus: string) => {
    try {
      let timeOut = currentOrder.dateOut;
      if (newStatus === "SIAP AMBIL" && currentOrder.status !== "SIAP AMBIL") {
        if (window.confirm(`Status diubah ke "Siap Ambil". Kirim WhatsApp ke pelanggan?`)) sendWhatsAppNotification(currentOrder); 
      }
      if (newStatus === "SELESAI" && currentOrder.status !== "SELESAI") timeOut = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      else if (newStatus !== "SELESAI") timeOut = null;
      await updateDoc(doc(db, "orders", firebaseId), { status: newStatus, dateOut: timeOut });
    } catch (error) { alert("Gagal mengubah status."); }
  };

  const handleDeleteOrder = async (firebaseId: string, customerName: string) => {
    if (window.confirm(`Yakin membatalkan pesanan milik "${customerName}"?`)) { try { await deleteDoc(doc(db, "orders", firebaseId)); } catch (error) { alert("Gagal membatalkan pesanan."); } }
  };

  const printThermalReceipt = (orderData: any, addonsList: any[]) => { 
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) { alert("Izinkan pop-up untuk mencetak struk."); return; }
    
    const logoHtml = storeLogoUrl ? `<div style="text-align:center; margin-bottom:10px;"><img src="${storeLogoUrl}" style="max-width:80px; max-height:80px; filter: grayscale(100%);" alt="Logo"/></div>` : '';
    const addressHtml = storeAddress ? `<div style="text-align:center; font-size:10px; margin-top:4px;">${storeAddress}</div>` : '';
    const phoneHtml = storePhone ? `<div style="text-align:center; font-size:10px;">WA: ${storePhone}</div>` : '';

    const html = `<html><head><style>@page { margin: 0; } body { font-family: monospace; width: 58mm; padding: 10px; font-size: 12px; color: #000; } .flex-between { display: flex; justify-content: space-between; }</style></head><body>
      ${logoHtml}
      <div style="text-align:center;font-weight:bold;font-size:16px;">${storeName.toUpperCase()}</div>
      ${addressHtml}
      ${phoneHtml}
      <div style="border-bottom:1px dashed #000;margin:8px 0;"></div>
      <div style="text-align:center;font-size:10px;">Nota: ${orderData.invoiceId} <br/> ${orderData.dateIn}</div>
      <div style="border-bottom:1px dashed #000;margin:8px 0;"></div>
      <div style="font-size:10px;">Pelanggan: <span style="font-weight:bold;">${orderData.customer}</span></div>
      <div style="border-bottom:1px dashed #000;margin:8px 0;"></div>
      <div class="flex-between" style="font-weight:bold;font-size:10px;"><span>LAYANAN</span><span>HARGA</span></div>
      <div class="flex-between" style="font-size:10px;margin-top:8px;"><span style="max-width:60%;">${orderData.service}</span><span>${formatRp(orderData.basePricePlusExpress)}</span></div>
      ${addonsList.map(a => `<div class="flex-between" style="font-size:10px;margin-top:4px;"><span style="max-width:60%;">+ ${a.name}</span><span>${formatRp(a.price)}</span></div>`).join('')}
      <div style="border-bottom:1px dashed #000;margin:8px 0;"></div>
      <div class="flex-between" style="font-weight:bold;font-size:14px;"><span>TOTAL</span><span>${formatRp(orderData.totalPrice)}</span></div>
      <div style="border-bottom:1px dashed #000;margin:8px 0;"></div>
      <div style="text-align:center;font-size:10px;margin-top:8px;">Terima kasih!<br/>Powered by LaundryFlow SaaS</div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}</script></body></html>`;
    printWindow.document.write(html); printWindow.document.close();
  };

  let activeServiceName = ""; let activeBasePrice = 0; let activeUnit = "Kg"; let activeType = "kg"; let activeCapacity = 1; let activeMinOrder = 1; let activeRoundUp = false;
  if (selectedServiceId === "custom") { activeServiceName = customServiceName || "Layanan Kustom"; activeBasePrice = Number(customServicePrice) || 0; activeUnit = "Unit"; activeType = "custom"; activeMinOrder = 1; activeRoundUp = false; } else { const s = storeServices.find(s => s.id === selectedServiceId) || storeServices[0]; if (s) { activeServiceName = s.name; activeBasePrice = s.price; activeUnit = s.unit; activeType = s.type; activeCapacity = s.capacity; activeMinOrder = s.minOrder || 1; activeRoundUp = s.roundUp || false; } }
  
  const rawInputVal = Number(inputValue) || 0; let processedVal = rawInputVal; let basePrice = 0; let loadBreakdownText = "";
  if (rawInputVal > 0) {
    if (activeRoundUp && activeType !== 'pcs') processedVal = Math.ceil(rawInputVal); 
    let effectiveVal = Math.max(processedVal, activeMinOrder);
    if (activeType === "load") { const totalLoads = Math.ceil(effectiveVal / activeCapacity); basePrice = totalLoads * activeBasePrice; loadBreakdownText = `${totalLoads} Mesin`; } else { basePrice = effectiveVal * activeBasePrice; let breakdown = `${effectiveVal} ${activeType === 'pcs' ? 'Pcs' : 'Kg'}`; if (effectiveVal > processedVal) breakdown += ` (Dikenakan Min. ${activeMinOrder})`; else if (processedVal > rawInputVal) breakdown += ` (Dibulatkan ke atas)`; loadBreakdownText = breakdown; }
  }
  const expressFee = isExpress ? (basePrice * 0.5) : 0;
  const predefinedAddonsFee = selectedAddons.reduce((total, addonId) => { const addon = storeAddons.find(a => a.id === addonId); return total + (addon ? addon.price : 0); }, 0);
  const manualAddonsFee = customAddonsList.reduce((total, addon) => total + addon.price, 0);
  const addonsFee = predefinedAddonsFee + manualAddonsFee;
  const totalPrice = basePrice + expressFee + addonsFee;

  const handleSaveOrder = async (shouldPrint: boolean) => {
    if (!customerName) { alert("Masukkan nama pelanggan!"); return; }
    if (rawInputVal <= 0) { alert("Masukkan jumlah/berat cucian!"); return;}
    setIsSaving(true);
    try {
      const now = new Date(); const formattedDate = now.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const serviceText = `${activeServiceName} [${loadBreakdownText}]`; const invoiceId = `#INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrderData = { invoiceId, customer: customerName, customerPhone, initials: customerName.charAt(0).toUpperCase(), service: `${serviceText} ${isExpress ? '⚡ Kilat' : ''}`, status: "ANTREAN", dateIn: formattedDate, dateOut: null, totalPrice, basePricePlusExpress: basePrice + expressFee, userEmail: user?.email, createdAt: serverTimestamp() };
      await addDoc(collection(db, "orders"), newOrderData);
      let printAddons: any[] = []; selectedAddons.forEach(id => { const addon = storeAddons.find(a => a.id === id); if (addon) printAddons.push(addon); }); printAddons = [...printAddons, ...customAddonsList];
      if (shouldPrint) printThermalReceipt(newOrderData, printAddons);
      setIsOrderModalOpen(false); setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setInputValue(1); setSelectedAddons([]); setCustomAddonsList([]); setIsExpress(false); setCustomServiceName(""); setCustomServicePrice(""); if(storeServices.length > 0) setSelectedServiceId(storeServices[0].id);
    } catch (error) { alert("Gagal menyimpan pesanan."); } finally { setIsSaving(false); }
  };

  const togglePredefinedAddon = (id: string) => setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  const handleAddManualAddon = () => { if (manualAddonName.trim() === "") return; setCustomAddonsList([...customAddonsList, { id: Date.now().toString(), name: manualAddonName, price: Number(manualAddonPrice) || 0 }]); setManualAddonName(""); setManualAddonPrice(""); setShowManualAddon(false); };
  const removeManualAddon = (id: string) => setCustomAddonsList(customAddonsList.filter(a => a.id !== id));
  
  const getStatusInfo = (status: string) => {
    switch(status) {
      case "ANTREAN": return { color: "bg-slate-100 text-slate-600 border-slate-200", prog: "bg-slate-300", w: "10%" };
      case "DICUCI": return { color: "bg-blue-50 text-blue-600 border-blue-200", prog: "bg-blue-500", w: "30%" };
      case "DIKERINGKAN": return { color: "bg-amber-50 text-amber-600 border-amber-200", prog: "bg-amber-500", w: "50%" };
      case "DISETRIKA": return { color: "bg-purple-50 text-purple-600 border-purple-200", prog: "bg-purple-500", w: "70%" };
      case "SIAP AMBIL": return { color: "bg-emerald-50 text-emerald-600 border-emerald-200", prog: "bg-emerald-500", w: "90%" };
      case "SELESAI": return { color: "bg-green-100 text-green-700 border-green-300", prog: "bg-green-600", w: "100%" };
      default: return { color: "bg-slate-100 text-slate-600 border-slate-200", prog: "bg-slate-300", w: "0%" };
    }
  };

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-background-light"><span className="animate-spin material-icons-outlined text-4xl text-indigo-500">autorenew</span></div>;

  const displayedOrders = orders.filter(o => {
    const matchTab = activeTab === "proses" ? o.status !== "SELESAI" : o.status === "SELESAI";
    const q = searchQuery.toLowerCase();
    const matchSearch = (o.customer && o.customer.toLowerCase().includes(q)) || (o.invoiceId && o.invoiceId.toLowerCase().includes(q)) || (o.customerPhone && o.customerPhone.includes(q));
    return matchTab && matchSearch;
  });

  const totalPendapatan = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const pesananAktif = orders.filter(o => o.status !== "SELESAI").length;

  const handleLogout = async () => { await auth.signOut(); router.push("/login"); };

  return (
    <div className="bg-background-light font-display text-slate-800 antialiased flex min-h-screen relative overflow-x-hidden pb-16 lg:pb-0 w-full max-w-[100vw]">
      
      {/* 🔴 SUBSCRIPTION GUARD */}
      {storeStatus === "NUNGGAK" && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-100"><span className="material-icons-outlined text-4xl">block</span></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Layanan Ditangguhkan</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">Masa aktif sistem Kasir Cloud untuk <b>{storeName}</b> telah berakhir. Silakan selesaikan pembayaran untuk kembali menggunakan fitur.</p>
            <button onClick={() => window.open(`https://wa.me/628123456789?text=Halo Admin LaundryFlow, saya ingin memperpanjang langganan untuk toko ${storeName}`)} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/30 transition-all flex justify-center items-center gap-2">
              <span className="material-icons-outlined text-[18px]">payment</span> Hubungi Admin
            </button>
            <button onClick={handleLogout} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Keluar Akun</button>
          </div>
        </div>
      )}

      {/* SIDEBAR (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen z-10 shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            {storeLogoUrl ? (
               <img src={storeLogoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white shadow-sm border border-slate-200" />
            ) : (
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20"><span className="material-icons-outlined text-white text-[18px]">local_laundry_service</span></div>
            )}
            <span className="text-xl font-bold tracking-tight text-slate-900 truncate">{storeName}</span>
          </div>
        </div>
        <nav className="mt-2 flex-1 overflow-y-auto">
          <div className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Navigasi</div>
          <button onClick={() => setCurrentView("dashboard")} className={`w-full flex items-center px-6 py-3.5 transition-colors ${currentView === "dashboard" ? 'bg-indigo-50/60 text-indigo-600 border-r-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}><span className="material-icons-outlined mr-3 text-[20px]">dashboard</span><span className="font-semibold text-sm">Dasbor Kasir</span></button>
          <div className="px-6 py-3 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Marketing</div>
          <button onClick={() => setCurrentView("marketing")} className={`w-full flex items-center px-6 py-3.5 transition-colors ${currentView === "marketing" ? 'bg-indigo-50/60 text-indigo-600 border-r-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}><span className="material-icons-outlined mr-3 text-[20px]">campaign</span><span className="font-semibold text-sm">Pemasaran WA</span></button>
          <div className="px-6 py-3 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sistem</div>
          <button onClick={() => setCurrentView("settings")} className={`w-full flex items-center px-6 py-3.5 transition-colors ${currentView === "settings" ? 'bg-indigo-50/60 text-indigo-600 border-r-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}><span className="material-icons-outlined mr-3 text-[20px]">tune</span><span className="font-semibold text-sm">Pengaturan Toko</span></button>
        </nav>
        <div className="p-6 border-t border-slate-200">
           <button onClick={handleLogout} className="w-full flex items-center justify-center text-sm font-bold text-slate-500 hover:text-red-500 transition-colors gap-2"><span className="material-icons-outlined text-[18px]">logout</span> Keluar Akun</button>
        </div>
      </aside>

      {/* BOTTOM NAV (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 flex justify-around items-center z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
        <button onClick={() => setCurrentView("dashboard")} className={`flex flex-col items-center py-3 px-4 flex-1 transition-colors ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-icons-outlined text-[22px] mb-1">dashboard</span><span className="text-[10px] font-bold">Kasir</span></button>
        <button onClick={() => setCurrentView("marketing")} className={`flex flex-col items-center py-3 px-4 flex-1 transition-colors ${currentView === 'marketing' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-icons-outlined text-[22px] mb-1">campaign</span><span className="text-[10px] font-bold">Promo</span></button>
        <button onClick={() => setCurrentView("settings")} className={`flex flex-col items-center py-3 px-4 flex-1 transition-colors ${currentView === 'settings' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><span className="material-icons-outlined text-[22px] mb-1">tune</span><span className="text-[10px] font-bold">Toko</span></button>
      </nav>

      <main className="flex-1 flex flex-col min-h-screen w-full min-w-0">
        
        {/* HEADER AREA */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center p-4 sm:p-8 xl:p-10 pb-0 mb-6 sm:mb-8 gap-4 w-full">
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            <div className="lg:hidden shrink-0">
              {storeLogoUrl ? (<img src={storeLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white shadow-sm border border-slate-200" />) : (<div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md"><span className="material-icons-outlined text-white text-[20px]">local_laundry_service</span></div>)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">{currentView === 'dashboard' ? 'Ringkasan Dasbor' : currentView === 'marketing' ? 'Pemasaran & Broadcast' : 'Pengaturan Toko'}</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{currentView === 'dashboard' ? 'Sistem Terkoneksi dengan Cloud Database' : currentView === 'marketing' ? 'Kirim info promo massal ke pelanggan Anda' : 'Atur profil bisnis, layanan, dan WhatsApp'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end shrink-0">
            {currentView === 'dashboard' && (
              <button onClick={() => setIsOrderModalOpen(true)} className="flex-1 md:flex-none flex justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                <span className="material-icons-outlined text-[18px]">add</span> Buat Pesanan Baru
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-3 pl-2 sm:border-l border-slate-200"><div className="text-right"><p className="text-sm font-bold text-slate-800">{storeName}</p><p className="text-xs text-slate-500 truncate max-w-[120px] font-medium">{user.email}</p></div></div>
          </div>
        </header>

        {/* VIEW 1: DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="w-full px-4 sm:px-8 xl:px-10 pb-10 space-y-6 sm:space-y-8 animate-in fade-in duration-300 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0"><div className="p-2 bg-indigo-50 rounded-lg w-max mb-3 sm:mb-4"><span className="material-icons-outlined text-indigo-600">payments</span></div><h3 className="text-slate-500 text-xs sm:text-sm font-medium">Pemasukan Global</h3><p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 truncate">{formatRp(totalPendapatan)}</p></div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0"><div className="p-2 bg-indigo-50 rounded-lg w-max mb-3 sm:mb-4"><span className="material-icons-outlined text-indigo-600">local_laundry_service</span></div><h3 className="text-slate-500 text-xs sm:text-sm font-medium">Pesanan Aktif (Belum Selesai)</h3><p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 truncate">{pesananAktif} <span className="text-sm font-normal text-slate-400">Nota</span></p></div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm sm:col-span-2 lg:col-span-1 min-w-0"><div className="p-2 bg-indigo-50 rounded-lg w-max mb-3 sm:mb-4"><span className="material-icons-outlined text-indigo-600">check_circle</span></div><h3 className="text-slate-500 text-xs sm:text-sm font-medium">Pesanan Selesai / Diambil</h3><p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 truncate">{orders.length - pesananAktif} <span className="text-sm font-normal text-slate-400">Nota</span></p></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden w-full">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-white">
                <h2 className="font-bold text-lg text-slate-800 shrink-0">Pemantauan Cucian</h2>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-72"><span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span><input type="text" placeholder="Cari nota, nama, no HP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-400"/>{searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><span className="material-icons-outlined text-[16px]">close</span></button>}</div>
                  <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 w-full sm:w-auto justify-center"><button onClick={() => setActiveTab("proses")} className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "proses" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sedang Diproses</button><button onClick={() => setActiveTab("riwayat")} className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "riwayat" ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Riwayat Diambil</button></div>
                </div>
              </div>
              <div className="p-0 overflow-x-auto min-h-[300px] w-full">
                <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                  <thead className="bg-slate-50/50"><tr><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32">No. Nota</th><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48">Pelanggan</th><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Layanan</th><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48 text-center">Update Status</th>{activeTab === "proses" ? (<><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32 hidden sm:table-cell">Progres</th><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider w-16 text-center">Batal</th></>) : (<th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider w-48">Waktu Diambil (Bukti)</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {displayedOrders.length === 0 ? (<tr><td colSpan={activeTab === "proses" ? 6 : 5} className="px-6 py-12 text-center text-slate-400 text-sm">{searchQuery ? `Tidak ada pesanan dengan kata kunci "${searchQuery}"` : "Belum ada data pesanan."}</td></tr>) : (
                      displayedOrders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        return (
                          <tr key={order.firebaseId} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 sm:px-6 py-4"><div className="font-bold text-xs sm:text-sm text-slate-800">{order.invoiceId}</div><div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Masuk: {order.dateIn.split(' ')[0]}</div></td>
                            <td className="px-4 sm:px-6 py-4"><div className="flex items-center"><div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-[11px] font-bold text-indigo-600 mr-3 shrink-0 hidden sm:flex">{order.initials}</div><div><span className="text-xs sm:text-sm font-medium text-slate-700 block flex items-center gap-1">{order.customer} {order.customerPhone && <button onClick={() => sendWhatsAppNotification(order)} className="text-emerald-500 hover:text-emerald-600 ml-1"><span className="material-icons-outlined text-[14px]">chat</span></button>}</span><span className="text-[10px] text-indigo-500 font-bold block">{formatRp(order.totalPrice || 0)}</span></div></div></td>
                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-500 font-medium truncate max-w-[120px] sm:max-w-none">{order.service}</td>
                            <td className="px-4 sm:px-6 py-4 text-center"><select value={order.status} onChange={(e) => handleStatusChange(order.firebaseId, order, e.target.value)} className={`w-full sm:w-auto px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold text-center rounded-full border outline-none cursor-pointer appearance-none transition-all shadow-sm ${statusInfo.color}`} style={{ textAlignLast: 'center' }}><option value="ANTREAN">Antrean Baru</option><option value="DICUCI">Sedang Dicuci</option><option value="DIKERINGKAN">Dikeringkan</option><option value="DISETRIKA">Disetrika</option><option value="SIAP AMBIL">Siap Ambil</option><option value="SELESAI">Selesai (Diambil)</option></select></td>
                            {activeTab === "proses" ? (<><td className="px-4 sm:px-6 py-4 hidden sm:table-cell"><div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full transition-all duration-500 ${statusInfo.prog}`} style={{ width: statusInfo.w }}></div></div></td><td className="px-4 sm:px-6 py-4 text-center"><button onClick={() => handleDeleteOrder(order.firebaseId, order.customer)} className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors mx-auto"><span className="material-icons-outlined text-[16px]">delete</span></button></td></>) : (<td className="px-4 sm:px-6 py-4"><div className="flex items-center gap-1 sm:gap-2 text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1.5 rounded-lg border border-emerald-100 w-max"><span className="material-icons-outlined text-[14px] sm:text-[16px]">verified</span><span className="text-[10px] sm:text-xs font-bold">{order.dateOut?.split(' ')[0] || '-'}</span></div></td>)}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MARKETING */}
        {currentView === "marketing" && (
          <div className="w-full px-4 sm:px-8 xl:px-10 pb-10 animate-in fade-in duration-300 min-w-0">
            {!fonnteToken && (
               <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6 shadow-sm"><span className="material-icons-outlined text-red-500 shrink-0">warning</span><div className="min-w-0"><h4 className="font-bold text-sm">Fitur Terkunci</h4><p className="text-xs mt-0.5 leading-relaxed truncate whitespace-normal">Atur Token API Fonnte di menu <b>Pengaturan Toko</b> untuk mengaktifkan.</p></div></div>
            )}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[650px] w-full">
              
              <div className="w-full lg:w-1/3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 flex flex-col max-h-[300px] lg:max-h-none min-w-0">
                <div className="mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><span className="material-icons-outlined text-emerald-500">contacts</span> Target Penerima</h3><p className="text-xs text-slate-500 mt-1">Sistem mengambil kontak unik.</p></div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 mb-3 shadow-sm"><div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" checked={selectedMarketingCustomers.length === uniqueCustomers.length && uniqueCustomers.length > 0} onChange={handleSelectAllMarketing}/> <span className="text-xs font-bold text-slate-700">Pilih Semua</span></div><span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{selectedMarketingCustomers.length} Terpilih</span></div>
                <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl">
                  {uniqueCustomers.length === 0 ? (<div className="p-6 text-center text-xs text-slate-400">Belum ada data pelanggan.</div>) : (uniqueCustomers.map((c, idx) => (<label key={idx} className="flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"><input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" checked={selectedMarketingCustomers.includes(c.phone)} onChange={() => handleToggleMarketingCustomer(c.phone)}/><div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{c.name}</p><p className="text-xs text-slate-500 font-medium truncate">{c.phone}</p></div></label>)))}
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6 flex flex-col border-b lg:border-b-0 min-w-0">
                <div className="mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><span className="material-icons-outlined text-indigo-500">edit_note</span> Tulis Promo</h3><p className="text-xs text-slate-500 mt-1">Ketik isi pesan broadcast Anda.</p></div>
                <div className="flex flex-wrap gap-2 mb-3"><button onClick={() => setBroadcastMessage(prev => prev + "[Nama]")} className="text-[11px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">+ Sisipkan [Nama]</button><button onClick={() => setBroadcastMessage(prev => prev + "[Toko]")} className="text-[11px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">+ Sisipkan [Toko]</button></div>
                <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="flex-1 w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm leading-relaxed text-slate-700" placeholder="Ketik promo Anda di sini..."></textarea>
                <div className="mt-4 sm:mt-6 flex flex-col gap-2 w-full">
                  {isBroadcasting && (<div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2"><div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(broadcastProgress / selectedMarketingCustomers.length) * 100}%` }}></div></div>)}
                  <button disabled={isBroadcasting || selectedMarketingCustomers.length === 0 || !fonnteToken} onClick={handleSendBroadcast} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">{isBroadcasting ? (<><span className="animate-spin material-icons-outlined text-[18px]">autorenew</span> {broadcastProgress} / {selectedMarketingCustomers.length}...</>) : (<><span className="material-icons-outlined text-[18px]">send</span> Kirim ke {selectedMarketingCustomers.length} Orang</>)}</button>
                  <p className="text-center text-[10px] text-slate-400 font-medium">Sistem memberi jeda otomatis.</p>
                </div>
              </div>

              <div className="w-full lg:w-1/3 p-6 border-l border-slate-100 bg-slate-100 flex flex-col items-center justify-center hidden sm:flex"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Preview Tampilan</p><div className="w-[280px] h-[500px] bg-white rounded-[2rem] shadow-xl border-4 border-slate-300 overflow-hidden flex flex-col relative relative"><div className="bg-[#075E54] h-14 flex items-center px-4 gap-3 text-white shrink-0"><span className="material-icons-outlined text-white">arrow_back</span><div className="w-8 h-8 bg-slate-300 rounded-full shrink-0 overflow-hidden"><img src="https://ui-avatars.com/api/?name=C&background=random" alt="Avatar"/></div><div className="font-semibold text-sm truncate leading-tight">Bapak Budi <br/><span className="text-[10px] font-normal opacity-80">Online</span></div></div><div className="flex-1 p-3 bg-[#E5DDD5] overflow-y-auto flex flex-col justify-end" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' }}><div className="bg-white text-slate-800 p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[85%] self-end text-xs leading-relaxed whitespace-pre-wrap relative mb-2">{broadcastMessage.replace(/\[Nama\]/g, "Bapak Budi").replace(/\[Toko\]/g, storeName)}<div className="text-[9px] text-slate-400 text-right mt-1 opacity-80 flex justify-end items-center gap-1">10:45 <span className="material-icons-outlined text-[12px] text-blue-500">done_all</span></div></div></div><div className="bg-slate-100 h-14 shrink-0 flex items-center px-2 gap-2"><div className="flex-1 bg-white h-9 rounded-full flex items-center px-3 text-slate-400"><span className="material-icons-outlined text-sm">emoji_emotions</span> <span className="text-xs ml-2 opacity-60">Ketik pesan...</span></div><div className="w-9 h-9 bg-[#128C7E] rounded-full flex items-center justify-center text-white shrink-0"><span className="material-icons-outlined text-sm">mic</span></div></div></div></div>
            </div>
          </div>
        )}

        {/* VIEW 3: PENGATURAN TOKO */}
        {currentView === "settings" && (
          <div className="w-full px-4 sm:px-8 xl:px-10 pb-10 space-y-6 animate-in fade-in duration-300 min-w-0">
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 w-full min-w-0">
              <h2 className="font-bold text-base sm:text-lg text-slate-800 mb-6 flex items-center gap-2"><span className="material-icons-outlined text-indigo-500">storefront</span> Profil Bisnis & Identitas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                
                <div className="space-y-4 w-full min-w-0 flex flex-col justify-between">
                  <div className="space-y-2 w-full min-w-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Nama Laundry</label>
                    <input value={inputStoreName} onChange={e=>setInputStoreName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-medium" placeholder="Misal: Berkah Laundry"/>
                  </div>
                  <div className="space-y-2 w-full min-w-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Nomor HP Toko</label>
                    <input value={inputStorePhone} onChange={e=>setInputStorePhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-medium" placeholder="0812..."/>
                  </div>
                  <div className="space-y-2 w-full min-w-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Alamat Lengkap Toko</label>
                    <textarea value={inputStoreAddress} onChange={e=>setInputStoreAddress(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-medium resize-none" rows={3} placeholder="Jalan..."></textarea>
                  </div>
                </div>

                <div className="space-y-2 w-full min-w-0">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Logo Toko (Muncul di Struk)</label>
                  <div 
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-full min-h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all overflow-hidden
                      ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
                      ${inputStoreLogoUrl ? 'border-transparent bg-white p-0' : ''}`}
                  >
                    <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" ref={fileInputRef} onChange={handleFileInputChange} />
                    {inputStoreLogoUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-50 group">
                        <img src={inputStoreLogoUrl} alt="Preview Logo" className="max-h-[160px] object-contain p-2" />
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-bold flex items-center gap-1"><span className="material-icons-outlined text-sm">edit</span> Ganti Logo</span></div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${isDragging ? 'bg-indigo-200 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}><span className="material-icons-outlined">cloud_upload</span></div>
                        <p className="text-sm font-bold text-slate-700">Tarik & Lepas gambar di sini</p><p className="text-[10px] text-slate-400 mt-1">atau klik untuk mencari file (Max 1MB)</p>
                      </div>
                    )}
                  </div>
                  {inputStoreLogoUrl && (<button onClick={(e) => { e.stopPropagation(); setInputStoreLogoUrl(""); }} className="text-[10px] text-red-500 hover:underline flex items-center gap-1 mt-2"><span className="material-icons-outlined text-[12px]">delete</span> Hapus Logo</button>)}
                </div>

              </div>
              <div className="mt-6 flex justify-end w-full"><button onClick={handleSaveStoreBranding} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 sm:py-2.5 px-8 rounded-xl text-sm shadow-md transition-all">Simpan Profil Bisnis</button></div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-8 w-full min-w-0">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 hidden sm:flex"><span className="material-icons-outlined text-[24px]">forum</span></div>
                <div className="flex-1 w-full min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-emerald-900">Integrasi WhatsApp API</h3>
                  <p className="text-xs sm:text-sm text-emerald-700/80 mt-1 mb-4 leading-relaxed break-words">Hubungkan sistem kasir dengan WhatsApp toko Anda. <a href="https://fonnte.com" target="_blank" className="underline font-bold ml-1 text-emerald-700 hover:text-emerald-900">Dapatkan API Token Gratis di Fonnte.</a></p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full min-w-0"><input type="text" value={inputToken} onChange={e=>setInputToken(e.target.value)} className="flex-1 w-full text-sm py-3 sm:py-2.5 px-4 border border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white min-w-0" placeholder="Masukkan Token Fonnte..."/><button onClick={handleSaveStoreBranding} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 sm:py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm whitespace-nowrap shrink-0">Simpan Token</button></div>
                  {fonnteToken && (<div className="mt-3 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-emerald-600 bg-white w-max px-3 py-1.5 rounded-md border border-emerald-100 truncate"><span className="material-icons-outlined text-[14px]">check_circle</span> Token Fonnte Tersimpan & Aktif</div>)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px] w-full min-w-0">
              <div className="flex-1 p-5 sm:p-8 min-w-0">
                <div className="mb-6 sm:mb-8 border-b border-slate-100 pb-4"><h2 className="font-bold text-lg sm:text-xl text-slate-800 flex items-center gap-2"><span className="material-icons-outlined text-indigo-500">list_alt</span> Daftar Layanan Kasir</h2><p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola menu layanan dan harga toko Anda.</p></div>
                <div className="bg-indigo-50/30 rounded-xl p-4 sm:p-6 border border-indigo-100 mb-6 sm:mb-8">
                  <h3 className="text-[10px] sm:text-[11px] font-bold text-indigo-800 mb-4 uppercase tracking-widest">+ Tambah Layanan Baru</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                    <div className="md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase">Nama Layanan</label><input value={newSvcName} onChange={e=>setNewSvcName(e.target.value)} type="text" className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white" placeholder="Contoh: Cuci Karpet"/></div>
                    <div className="md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase">Harga (Rp)</label><input value={newSvcPrice} onChange={e=>setNewSvcPrice(e.target.value)} type="number" className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white" placeholder="0"/></div>
                    <div className="md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase">Hitungan</label><select value={newSvcType} onChange={e=>setNewSvcType(e.target.value)} className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg outline-none bg-white focus:border-indigo-400"><option value="kg">Per Kilo (Kg)</option><option value="pcs">Per Satuan (Pcs)</option><option value="load">Per Mesin (Load)</option></select></div>
                    {newSvcType === 'load' ? (<div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Kapasitas</label><input value={newSvcCap} onChange={e=>setNewSvcCap(e.target.value)} type="number" className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white" placeholder="Kg"/></div>) : (<div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Min. Order</label><input value={newSvcMinOrder} onChange={e=>setNewSvcMinOrder(e.target.value)} type="number" className="w-full text-sm py-2.5 px-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white" placeholder="1"/></div>)}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-indigo-100/50 pt-4 gap-4 sm:gap-0">
                    {newSvcType === 'kg' ? (<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newSvcRoundUp} onChange={e=>setNewSvcRoundUp(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"/><span className="text-[11px] sm:text-xs font-medium text-slate-700">Bulatkan timbangan ke atas (1.2kg jadi 2kg)</span></label>) : (<div className="hidden sm:block"></div>)}
                    <button onClick={handleAddNewService} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-lg text-sm transition-colors shadow-sm">Simpan Layanan Baru</button>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white w-full">
                  <table className="w-full text-left min-w-[400px]"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Info Layanan</th><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Harga & Tipe</th><th className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{storeServices.length === 0 ? (<tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">Belum ada layanan. Silakan tambahkan di atas.</td></tr>) : (storeServices.map(svc => (<tr key={svc.id} className="hover:bg-slate-50 transition-colors"><td className="px-4 sm:px-6 py-4"><div className="flex items-center gap-3 sm:gap-4"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shrink-0"><span className="material-icons-outlined text-[18px] sm:text-[20px]">{svc.icon}</span></div><div><span className="text-xs sm:text-sm font-bold text-slate-800 block">{svc.name}</span>{svc.type !== 'load' && (<span className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block">Min: {svc.minOrder || 1} {svc.unit} {svc.roundUp ? '• (Dibulatkan ke atas)' : ''}</span>)}</div></div></td><td className="px-4 sm:px-6 py-4"><div className="text-xs sm:text-sm font-bold text-indigo-600">{formatRp(svc.price)}</div><div className="mt-1">{svc.type === 'load' ? <span className="bg-amber-50 text-amber-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-amber-100 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Mesin (Max {svc.capacity} Kg)</span> : <span className="bg-slate-100 text-slate-600 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Per {svc.unit}</span>}</div></td><td className="px-4 sm:px-6 py-4 text-right"><button onClick={() => handleDeleteService(svc.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 bg-white hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 shadow-sm"><span className="material-icons-outlined text-[16px] sm:text-[18px]">delete</span></button></td></tr>)))}</tbody></table>
                </div>
              </div>
            </div>

            <div className="lg:hidden mt-6 w-full">
              <button onClick={handleLogout} className="w-full bg-white border border-red-200 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:bg-red-50 active:scale-95 transition-all">
                <span className="material-icons-outlined">logout</span> Keluar dari Sistem
              </button>
            </div>
            
          </div>
        )}
      </main>

      {/* --- MODAL POS KASIR --- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6 w-full h-full">
          <div className="bg-slate-50 w-full max-w-6xl h-[90vh] sm:h-[95vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 min-w-0">
            <div className="bg-white px-4 sm:px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 w-full"><div className="flex items-center gap-3"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><span className="material-icons-outlined text-[18px] sm:text-[24px]">point_of_sale</span></div><div><h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Terminal Kasir</h2><p className="text-[10px] sm:text-xs text-slate-500 font-medium">Sistem Cloud Aktif</p></div></div><button onClick={() => setIsOrderModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><span className="material-icons-outlined text-[20px]">close</span></button></div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full min-w-0">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-full w-full">
                
                <div className="w-full lg:w-1/4 flex flex-col gap-4 min-w-0">
                  <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/60 w-full"><h3 className="font-bold text-slate-800 text-sm tracking-wide mb-3 sm:mb-4">Data Pelanggan</h3><div className="space-y-3 sm:space-y-4 w-full"><div className="space-y-1.5 w-full"><label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Nama Lengkap</label><input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" type="text" placeholder="Masukkan nama..."/></div><div className="space-y-1.5 w-full"><label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Nomor WhatsApp</label><input value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" type="tel" placeholder="Contoh: 081234567..."/></div><div className="space-y-1.5 w-full"><label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Alamat Lengkap</label><textarea value={customerAddress} onChange={(e)=>setCustomerAddress(e.target.value)} className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" rows={2} placeholder="Jalan..."></textarea></div></div></div>
                </div>
                
                <div className="w-full lg:w-5/12 flex flex-col gap-4 min-w-0">
                  <div className="flex items-center justify-between px-1 w-full"><h3 className="font-bold text-slate-800 text-base sm:text-lg">Menu Layanan</h3><div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm cursor-pointer shrink-0"><button onClick={() => setIsExpress(false)} className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors ${!isExpress ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}>Reguler</button><button onClick={() => setIsExpress(true)} className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-colors ${isExpress ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-500'}`}>Kilat</button></div></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
                    {storeServices.map((s) => (<button key={s.id} onClick={() => setSelectedServiceId(s.id)} className={`relative bg-white p-3 rounded-xl border-2 shadow-sm text-left group transition-all min-w-0 ${selectedServiceId === s.id ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/30' : 'border-transparent border-slate-200 hover:border-indigo-300'}`}>{selectedServiceId === s.id && <div className="absolute top-2 right-2 text-indigo-600"><span className="material-icons-outlined text-[16px]">check_circle</span></div>}<div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 transition-transform ${selectedServiceId === s.id ? 'bg-indigo-100' : 'bg-slate-50 group-hover:scale-110'}`}><span className={`material-icons-outlined text-[16px] sm:text-[18px] ${selectedServiceId === s.id ? 'text-indigo-600' : 'text-slate-500'}`}>{s.icon}</span></div><h4 className="font-bold text-slate-800 text-[11px] sm:text-xs mb-1 line-clamp-2 leading-tight">{s.name}</h4><div className={`font-bold text-[10px] sm:text-[11px] mt-auto pt-1 flex justify-between ${selectedServiceId === s.id ? 'text-indigo-600' : 'text-slate-500'}`}><span>{formatRp(s.price)}</span><span className="font-normal opacity-70">/{s.unit}</span></div></button>))}
                    <button onClick={() => setSelectedServiceId("custom")} className={`relative bg-white p-3 rounded-xl border-2 shadow-sm text-left group transition-all min-w-0 ${selectedServiceId === "custom" ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/30' : 'border-dashed border-slate-300 hover:border-indigo-400'}`}>{selectedServiceId === "custom" && <div className="absolute top-2 right-2 text-indigo-600"><span className="material-icons-outlined text-[16px]">check_circle</span></div>}<div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 transition-transform ${selectedServiceId === "custom" ? 'bg-indigo-50' : 'bg-slate-100 group-hover:scale-110'}`}><span className={`material-icons-outlined text-[16px] sm:text-[18px] ${selectedServiceId === "custom" ? 'text-indigo-600' : 'text-slate-500'}`}>edit_note</span></div><h4 className="font-bold text-slate-800 text-[11px] sm:text-xs mb-1 truncate">Kustom</h4><p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Kasir isi sendiri</p></button>
                  </div>
                  {selectedServiceId === "custom" && (<div className="bg-indigo-50/50 p-3 sm:p-4 rounded-xl border border-indigo-100 flex gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 w-full"><div className="flex-1 space-y-1.5 min-w-0"><label className="text-[9px] sm:text-[10px] font-bold text-indigo-800 uppercase">Nama Cucian</label><input value={customServiceName} onChange={e=>setCustomServiceName(e.target.value)} type="text" className="w-full text-xs sm:text-sm py-2 px-3 rounded-md border border-indigo-200 outline-none" placeholder="Misal: Sepatu"/></div><div className="w-1/3 space-y-1.5 shrink-0"><label className="text-[9px] sm:text-[10px] font-bold text-indigo-800 uppercase">Harga Dasar</label><input value={customServicePrice} onChange={e=>setCustomServicePrice(Number(e.target.value) || "")} type="number" className="w-full text-xs sm:text-sm py-2 px-3 rounded-md border border-indigo-200 outline-none" placeholder="Rp 0"/></div></div>)}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm mt-auto w-full min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 text-slate-800"><span className="material-icons-outlined text-indigo-500 text-[16px] sm:text-[18px]">list_alt</span> Tambahan Khusus</h4>
                    <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">{storeAddons.map(addon => <button key={addon.id} onClick={() => togglePredefinedAddon(addon.id)} className={`px-2 sm:px-3 py-1.5 rounded-lg border text-[10px] sm:text-[11px] font-bold transition-all ${selectedAddons.includes(addon.id) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{addon.name} (+{formatRp(addon.price)})</button>)}{customAddonsList.map(addon => <button key={addon.id} onClick={() => removeManualAddon(addon.id)} className="px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500 bg-amber-50 text-amber-700 text-[10px] sm:text-[11px] font-bold group flex items-center gap-1" title="Hapus">{addon.name} (+{formatRp(addon.price)}) <span className="material-icons-outlined text-[12px] sm:text-[14px] group-hover:text-red-500">close</span></button>)}<button onClick={() => setShowManualAddon(!showManualAddon)} className="px-2 sm:px-3 py-1.5 rounded-lg bg-slate-50 border-dashed border border-slate-300 text-[10px] sm:text-[11px] font-bold text-slate-500">+ Ketik Manual</button></div>
                    {showManualAddon && (<div className="flex gap-2 p-2 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2 w-full"><input value={manualAddonName} onChange={e=>setManualAddonName(e.target.value)} type="text" placeholder="Catatan" className="flex-1 text-[10px] sm:text-xs px-2 sm:px-3 py-2 border border-slate-200 rounded-md outline-none min-w-0"/><input value={manualAddonPrice} onChange={e=>setManualAddonPrice(Number(e.target.value) || "")} type="number" placeholder="Biaya (0=gratis)" className="w-24 sm:w-32 text-[10px] sm:text-xs px-2 sm:px-3 py-2 border border-slate-200 rounded-md outline-none shrink-0"/><button onClick={handleAddManualAddon} className="bg-indigo-600 text-white px-2 sm:px-3 py-2 rounded-md text-[10px] sm:text-xs font-bold hover:bg-indigo-700 shrink-0">Tambah</button></div>)}
                  </div>
                </div>
                
                <div className="w-full lg:w-1/3 flex flex-col h-auto min-w-0">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-slate-800 text-sm tracking-wide">Kalkulasi Tagihan</h3></div>
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center"><div className="space-y-2 sm:space-y-3"><label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between"><span>{activeType === 'pcs' ? 'Jumlah (Pcs)' : 'Kuantitas'}</span></label><input className="w-full text-3xl sm:text-4xl font-black bg-slate-50 border border-slate-200 rounded-xl py-3 sm:py-5 px-4 focus:ring-2 focus:ring-indigo-500/20 text-indigo-600 outline-none transition-all text-center tracking-tight" type="number" value={inputValue} onChange={(e) => setInputValue(parseFloat(e.target.value) || "")} step="0.5" min="0" placeholder="0"/></div></div>
                    <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 mt-auto w-full">
                      <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                        <div className="flex justify-between text-sm items-start gap-2"><span className="text-slate-500 font-medium text-[11px] sm:text-xs leading-tight min-w-0 truncate">{activeServiceName} <br/><span className="font-bold text-indigo-500">[{loadBreakdownText}]</span></span><span className="font-semibold text-slate-700 text-xs shrink-0">{formatRp(basePrice)}</span></div>
                        {isExpress && <div className="flex justify-between text-sm"><span className="text-amber-500 font-bold text-[11px] sm:text-xs">⚡ Layanan Kilat (+50%)</span><span className="font-semibold text-amber-600 text-xs">{formatRp(expressFee)}</span></div>}
                        {selectedAddons.map(id => { const addon = storeAddons.find(a => a.id === id); return addon ? (<div key={id} className="flex justify-between text-sm gap-2"><span className="text-slate-500 font-medium text-[11px] sm:text-xs truncate">+ {addon.name}</span><span className="font-semibold text-slate-700 text-xs shrink-0">{formatRp(addon.price)}</span></div>) : null; })}
                        {customAddonsList.map(addon => <div key={addon.id} className="flex justify-between text-sm gap-2"><span className="text-slate-500 font-medium text-[11px] sm:text-xs truncate">+ {addon.name}</span><span className="font-semibold text-slate-700 text-xs shrink-0">{formatRp(addon.price)}</span></div>)}
                        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-slate-200/60 mt-2"><span className="font-bold text-slate-800 text-xs sm:text-sm">Total Tagihan</span><span className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight">{formatRp(totalPrice)}</span></div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 w-full">
                        <button disabled={isSaving} onClick={() => handleSaveOrder(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-bold py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm min-w-0 truncate px-2">
                          {isSaving ? <span className="animate-spin material-icons-outlined text-[16px] sm:text-[18px]">autorenew</span> : "Simpan Saja"}
                        </button>
                        <button disabled={isSaving} onClick={() => handleSaveOrder(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-1 sm:gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm min-w-0 truncate px-2">
                          {isSaving ? <span className="animate-spin material-icons-outlined text-[16px] sm:text-[18px]">autorenew</span> : <><span className="material-icons-outlined text-[16px] sm:text-[18px]">print</span> Simpan & Cetak</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}