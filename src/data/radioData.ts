import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  Headphones,
  Home,
  Mic2,
  Radio,
  ShieldCheck,
  UsersRound,
  Video,
  Wand2,
  Podcast,
  CalendarRange,
  Sparkles,
  ArrowLeftRight,
  BarChart3
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PageKey =
  | "splash"
  | "onboarding"
  | "login"
  | "dashboard"
  | "announcers"
  | "announcerProfile"
  | "attendance"
  | "schedule"
  | "streaming"
  | "liveOb"
  | "coverage"
  | "podcast"
  | "requests"
  | "complaints"
  | "aiScript"
  | "users"
  | "scheduleSwap"
  | "adminVerification"
  | "attendanceReport"
  | "profile";

import type { Permission } from "../types/domain";

export type NavItem = {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
};

export const primaryNav: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: Home, requiredPermission: "dashboard:read" },
  { key: "schedule", label: "Jadwal", icon: CalendarDays, requiredPermission: "schedule:read" },
  { key: "scheduleSwap", label: "Tukar Jadwal", icon: ArrowLeftRight, requiredPermission: "schedule:swap" },
  { key: "aiScript", label: "Buat Naskah", icon: Sparkles, requiredPermission: "ai:use" },
  { key: "streaming", label: "Streaming", icon: Radio, requiredPermission: "dashboard:read" },
  { key: "requests", label: "Request", icon: Headphones, requiredPermission: "complaints:submit" },
  { key: "liveOb", label: "Live OB", icon: Video, requiredPermission: "live_ob:manage" },
  { key: "podcast", label: "Podcast", icon: Podcast, requiredPermission: "dashboard:read" },
  { key: "coverage", label: "Event", icon: CalendarRange, requiredPermission: "coverage:manage" },
  { key: "announcers", label: "Penyiar", icon: Mic2, requiredPermission: "schedule:read" },
  { key: "attendance", label: "Absensi", icon: ClipboardCheck, requiredPermission: "attendance:self" },
  { key: "users", label: "Kelola User", icon: UsersRound, requiredPermission: "users:manage" },
  { key: "adminVerification", label: "Verifikasi Swap", icon: ShieldCheck, requiredPermission: "schedule:manage" },
  { key: "attendanceReport", label: "Rekap Absen", icon: BarChart3, requiredPermission: "users:manage" },
  { key: "complaints", label: "Aduan", icon: Bell, requiredPermission: "complaints:submit" }
];

export const bottomNav = primaryNav;

export const dashboardStats = [
  { label: "Pegawai hadir", value: "28", change: "+6 dari kemarin" },
  { label: "Program utama", value: "28", change: "7 hari siaran" },
  { label: "Liputan aktif", value: "7", change: "2 butuh review" },
  { label: "Program sisipan", value: "7", change: "setiap hari" }
];

export const todayPrograms = [
  {
    time: "08.00 - 10.00",
    title: "Selamat Pagi Pinrang",
    host: "Miah",
    status: "live"
  },
  {
    time: "14.00 - 16.00",
    title: "Informasi Seputar Pinrang",
    host: "Wiwik",
    status: "ready"
  },
  {
    time: "16.00 - 18.00",
    title: "Siporio Siporennu",
    host: "Sul",
    status: "ready"
  },
  {
    time: "20.00 - 22.00",
    title: "Aga Kareba",
    host: "Amar",
    status: "ready"
  }
];

export type BroadcastProgramSlot = {
  day: string;
  time: string;
  program: string;
  description: string;
  announcer: string;
};

export const weeklyBroadcastSchedule: BroadcastProgramSlot[] = [
  {
    day: "Senin",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang",
    description: "Berita/informasi/Tips & info lalu lintas/interaktif",
    announcer: "Miah"
  },
  {
    day: "Senin",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Wiwik"
  },
  {
    day: "Senin",
    time: "16.00 - 18.00",
    program: "Siporio Siporennu",
    description: "Ajang lagu bugis, info seni & budaya, request/interaktif",
    announcer: "Sul"
  },
  {
    day: "Senin",
    time: "20.00 - 22.00",
    program: "Aga Kareba",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Amar"
  },
  {
    day: "Selasa",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang",
    description: "Berita/informasi/Tips & info lalu lintas/interaktif",
    announcer: "Miah"
  },
  {
    day: "Selasa",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Wiwik"
  },
  {
    day: "Selasa",
    time: "16.00 - 18.00",
    program: "Siporio Siporennu",
    description: "Ajang lagu bugis, info seni & budaya, request/interaktif",
    announcer: "Sul"
  },
  {
    day: "Selasa",
    time: "20.00 - 22.00",
    program: "Aga Kareba",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Ria"
  },
  {
    day: "Rabu",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang",
    description: "Berita/informasi/Tips & info lalu lintas/interaktif",
    announcer: "Miah"
  },
  {
    day: "Rabu",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Wiwik"
  },
  {
    day: "Rabu",
    time: "16.00 - 18.00",
    program: "Halo Bumi Lasinrang (Podcast / Siaran Reguler)",
    description: "Podcast Studio / Live Outdoor Broadcasting, request/interaktif",
    announcer: "Amar & Riska"
  },
  {
    day: "Rabu",
    time: "20.00 - 22.00",
    program: "Aga Kareba",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Ria"
  },
  {
    day: "Kamis",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang",
    description: "Berita/informasi/Tips & info lalu lintas/interaktif",
    announcer: "Amar"
  },
  {
    day: "Kamis",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Riska"
  },
  {
    day: "Kamis",
    time: "16.00 - 18.00",
    program: "Siporio Siporennu",
    description: "Ajang lagu bugis, info seni & budaya, request/interaktif",
    announcer: "Sul"
  },
  {
    day: "Kamis",
    time: "20.00 - 22.00",
    program: "Aga Kareba",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Ria"
  },
  {
    day: "Jumat",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang (SBL Goes to School)",
    description: "Sosialisasi, Workshop & Live Outdoor Broadcasting",
    announcer: "Riska / Tim SBL"
  },
  {
    day: "Jumat",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Amar"
  },
  {
    day: "Jumat",
    time: "16.00 - 18.00",
    program: "Jumat Ceria (Program Edukasi)",
    description: "Program pendidikan yang dibawakan dengan suasana santai dan ceria",
    announcer: "Miah / Dikbud, Dispusip, Sahabat KITA"
  },
  {
    day: "Jumat",
    time: "20.00 - 22.00",
    program: "Aga Kareba",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Ria"
  },
  {
    day: "Sabtu",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang (Weekend Edition)",
    description: "Berita/informasi/Tips & Live Outdoor Broadcasting/interaktif",
    announcer: "Riska"
  },
  {
    day: "Sabtu",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Wiwik"
  },
  {
    day: "Sabtu",
    time: "16.00 - 18.00",
    program: "Pinrang Creative Network",
    description: "Program Komunitas / Pelaku Ekonomi Kreatif",
    announcer: "Miah / Komunitas EKRAF"
  },
  {
    day: "Sabtu",
    time: "20.00 - 22.00",
    program: "Aga Kareba / SBL on Stage",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Sul"
  },
  {
    day: "Minggu",
    time: "08.00 - 10.00",
    program: "Salam Bumi Lasinrang (Weekend Edition)",
    description: "Berita/informasi/Tips & Live Outdoor Broadcasting/interaktif",
    announcer: "Ria"
  },
  {
    day: "Minggu",
    time: "14.00 - 16.00",
    program: "Informasi Seputar Pinrang",
    description: "Berita/informasi, info lalu lintas, request/interaktif",
    announcer: "Wiwik"
  },
  {
    day: "Minggu",
    time: "16.00 - 18.00",
    program: "Pinrang KEREN!",
    description: "Program inspiratif, menghadirkan tokoh atau komunitas berprestasi",
    announcer: "Amar & Riska / Tokoh / Komunitas"
  },
  {
    day: "Minggu",
    time: "20.00 - 22.00",
    program: "Aga Kareba (Weekend Edition)",
    description: "Berita/informasi/Tips, request/interaktif",
    announcer: "Sul"
  }
];

export const dailyInsertPrograms = [
  {
    time: "05.00 - 07.00",
    program: "Salam Subuh",
    description:
      "Tausiah subuh, doa pagi, dan kabar inspiratif dari masjid & masyarakat Pinrang.",
    pic: "DMI, Baznas, Kemenag, Bag. Kesra"
  },
  {
    time: "07.00 - 08.00",
    program: "Semangat Pagi",
    description: "Auto Playlist Morning",
    pic: "Transisi menuju program siaran utama pagi"
  },
  {
    time: "10.00 - 11.30",
    program: "Lasinrang Preneur",
    description:
      "Cerita pelaku UMKM & pengrajin lokal, produk unggulan Pinrang, dan tips bisnis.",
    pic: "Dekranasda, Disperindag, DiskopUKM, HIPMI / TDA"
  },
  {
    time: "11.30 - 13.00",
    program: "Keluarga Berdaya (PKK)",
    description:
      "Edukasi keluarga, parenting, gizi, dan kisah inspiratif perempuan Pinrang.",
    pic: "TP PKK / Dharma Wanita"
  },
  {
    time: "13.00 - 14.00",
    program: "Iklan Layanan Masyarakat, Konten Edukasi, Tips",
    description: "Auto Playlist",
    pic: "Iklan layanan masyarakat, konten edukasi, tips"
  },
  {
    time: "18.00 - 20.00",
    program: "Program Religi",
    description: "Tausiah rekaman & lagu religi",
    pic: "DMI, Baznas, Kemenag, Bag. Kesra, Organisasi Keagamaan"
  },
  {
    time: "22.00 - 23.00",
    program: "Lagu-lagu Terbaik",
    description: "Auto Playlist",
    pic: "Penutup siaran sebelum istirahat malam"
  }
];

export const announcerBreakdown = [
  {
    name: "Wiwik",
    days: ["Senin", "Selasa", "Rabu", "Sabtu", "Minggu"],
    totalDays: 5,
    totalHours: 10
  },
  {
    name: "Sul",
    days: ["Senin", "Selasa", "Kamis", "Sabtu", "Minggu"],
    totalDays: 5,
    totalHours: 10
  },
  {
    name: "Amar",
    days: ["Senin", "Rabu", "Kamis", "Jumat", "Minggu"],
    totalDays: 5,
    totalHours: 10
  },
  {
    name: "Riska",
    days: ["Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    totalDays: 5,
    totalHours: 10
  },
  {
    name: "Ria",
    days: ["Selasa", "Rabu", "Kamis", "Jumat", "Minggu"],
    totalDays: 5,
    totalHours: 10
  },
  {
    name: "Miah",
    days: ["Senin", "Selasa", "Rabu", "Jumat", "Sabtu"],
    totalDays: 5,
    totalHours: 10
  },
  {
    name: "Hendra",
    days: ["Setiap Hari"],
    totalDays: 7,
    totalHours: 0,
    note: "Setup RadioBoss untuk program sisipan/tanpa penyiar"
  }
];

export type AnnouncerProfile = {
  fullName: string;
  airName: string;
  scheduleNames: string[];
  photoUrl: string;
  whatsapp?: string;
  decreeOrder: number;
  active: boolean;
  note?: string;
};

export const directorProfile = {
  fullName: "Fajar Bakri",
  position: "Direktur Utama",
  decreeNumber: "482/001/SBL/I/2026",
  decreeDate: "02 Januari 2026",
  decreeTitle:
    "Pengangkatan Penyiar Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang"
};

export const announcers = [
  {
    id: "085397286112",
    fullName: "AKHMAD AMIRUDDIN",
    airName: "AMAR",
    scheduleNames: ["Amar"],
    photoUrl: "https://radiosbl.web.app/crew/AMAR%20(6).png",
    decreeOrder: 1,
    active: true
  },
  {
    id: "085343820280",
    fullName: "SULAIMAN",
    airName: "SUL",
    scheduleNames: ["Sul"],
    photoUrl: "https://radiosbl.web.app/crew/SUL%20(5).png",
    decreeOrder: 2,
    active: true
  },
  {
    id: "081342103115",
    fullName: "WIWIK",
    airName: "RENA THABITA",
    scheduleNames: ["Rena", "Wiwik"],
    photoUrl: "https://radiosbl.web.app/crew/WIWIK%20(2).png",
    decreeOrder: 3,
    active: true
  },
  {
    id: "082323334842",
    fullName: "RISKA DWIYANTI",
    airName: "RISKA",
    scheduleNames: ["Riska"],
    photoUrl: "https://radiosbl.web.app/crew/RISKA%20(2).png",
    decreeOrder: 4,
    active: true
  },
  {
    id: "085242918411",
    fullName: "ST. RUKIAH",
    airName: "RIA FINGKY",
    scheduleNames: ["Ria"],
    photoUrl: "https://radiosbl.web.app/crew/RIA%20(4).png",
    decreeOrder: 5,
    active: true
  },
  {
    id: "08114441006",
    fullName: "SALMIAH",
    airName: "MIAH JUFRI",
    scheduleNames: ["Miah"],
    photoUrl: "https://radiosbl.web.app/crew/Miah.png",
    decreeOrder: 6,
    active: true
  },
  {
    id: "085255300670",
    fullName: "MUHAMMAD CHENDRA BURHAN",
    airName: "HENDRA",
    scheduleNames: ["Hendra"],
    photoUrl: "https://radiosbl.web.app/crew/PROF%20(1).png",
    decreeOrder: 7,
    active: true
  }
];

export const stationInfo = {
  name: "Radio Suara Bumi Lasinrang",
  legalName: "Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang",
  frequency: "SBL 92,4 FM",
  address: "Jl. Bintang No. 1 Kabupaten Pinrang",
  postalCode: "91212",
  phone: "+62 851-2256-1992",
  socialHandle: "Radio Suara Bumi Lasinrang",
  streamUrl: "https://pu.klikhost.com/proxy/sbl/stream",
  publicStreamPage: "sbl.pinrangkab.go.id/radio-stream",
  website: "sbl.pinrangkab.go.id",
  director: directorProfile,
  announcers: announcers
};

export const employees = [
  { id: "emp-fajar", name: "FAJAR BAKRI", role: "Direktur Utama", wa: "081343511099" },
  { id: "emp-widy", name: "ANDI HASWIDY RUSTAM", role: "Ketua Dewan Pengawas", wa: "08114221001" },
  { id: "emp-hendra", name: "MUHAMMAD CHENDRA BURHAN", role: "Engineer", wa: "085255300670" },
  { id: "emp-azhar", name: "ANDI AZHAR", role: "IT", wa: "085156919530" },
  { id: "emp-muhas", name: "MUHAMMAD SALEH", role: "Reporter Lapangan", wa: "085242640984" },
  { id: "emp-chia", name: "FAUZIAH ABBAS", role: "Finance", wa: "081346353287" },
  { id: "emp-occo", name: "Tri Amri Maramat", role: "Sekretaris Diskominfosandi", wa: "081355393997" },
  { id: "emp-iqbal", name: "MUH. IQBAL", role: "Kabid Humas", wa: "08114444970" },
  { id: "emp-alim", name: "MURSALIM", role: "Manajemen", wa: "081245328224" }
];

export const modules = [
  { label: "Auth & Role", icon: ShieldCheck, state: "Phase 1" },
  { label: "Penyiar", icon: Mic2, state: "Phase 1" },
  { label: "Reporter", icon: UsersRound, state: "Phase 2" },
  { label: "Gemini AI", icon: Wand2, state: "Phase 6" },
  { label: "Audio Player", icon: Headphones, state: "Ready UI" }
];

export const liveChecklist = [
  { label: "Mixer dan routing audio", done: true },
  { label: "Kamera studio dan frame OB", done: true },
  { label: "Link YouTube Live", done: false },
  { label: "Discord room kru", done: true },
  { label: "Rundown final pimpinan", done: false }
];

export const complaints = [
  {
    category: "Informasi Publik",
    title: "Permintaan jadwal siaran edukasi",
    status: "Baru"
  },
  {
    category: "Teknis",
    title: "Streaming putus di wilayah Suppa",
    status: "Diproses"
  },
  {
    category: "Program",
    title: "Usulan dialog UMKM malam Jumat",
    status: "Terverifikasi"
  }
];
