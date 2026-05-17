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
  { key: "attendanceReport", label: "Rekap Absen", icon: BarChart3, requiredPermission: "attendance:manage" },
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

export type ProgramInfo = {
  title: string;
  description: string;
  imageUrl: string;
};

const programFallbackInfo: ProgramInfo = {
  title: "Radio SBL 92.4 FM",
  description:
    "Program Radio SBL yang menghadirkan informasi, hiburan, edukasi, dan interaksi hangat untuk masyarakat Pinrang.",
  imageUrl: "/LogoSBL.svg"
};

const programCatalog: Array<ProgramInfo & { match: string[] }> = [
  {
    title: "Salam Subuh Lasinrang",
    match: ["Salam Subuh"],
    imageUrl: "/program/Info_Terkini.jpg",
    description:
      "Program religi pagi yang menghadirkan tausiah, doa subuh, dan kabar inspiratif dari masjid serta masyarakat Pinrang untuk menemani awal hari dengan suasana sejuk dan penuh motivasi."
  },
  {
    title: "Salam Bumi Lasinrang",
    match: ["Salam Bumi Lasinrang"],
    imageUrl: "/program/Salam_Bumi_lasinrang.jpg",
    description:
      "Program pagi informatif dan interaktif berisi berita lokal, info lalu lintas, tips kehidupan, motivasi, serta sapaan hangat untuk menemani aktivitas masyarakat Pinrang setiap pagi."
  },
  {
    title: "Informasi Seputar Pinrang",
    match: ["Informasi Seputar Pinrang"],
    imageUrl: "/program/Informasi_Seputar_Pinrang.jpg",
    description:
      "Majalah udara siang yang menyajikan berita pemerintahan, informasi publik, aktivitas komunitas, info lalu lintas, edukasi, dan dialog interaktif seputar perkembangan Kabupaten Pinrang."
  },
  {
    title: "Siporio Siporennu",
    match: ["Siporio Siporennu"],
    imageUrl: "/program/Siporio_Siporennu.jpg",
    description:
      "Program musik dan budaya Bugis yang menghadirkan lagu daerah, cerita tradisi, petuah lokal, serta interaksi pendengar dengan nuansa khas budaya Pinrang."
  },
  {
    title: "Halo Bumi Lasinrang (Podcast SBL)",
    match: ["Halo Bumi Lasinrang", "Podcast SBL", "Podcast / Siaran Reguler"],
    imageUrl: "/program/PODCAST_SBL.jpg",
    description:
      "Program podcast dan live outdoor broadcasting yang menghadirkan dialog santai, inspiratif, dan interaktif bersama tokoh, komunitas, maupun narasumber pilihan dari berbagai bidang."
  },
  {
    title: "Aga Kareba?",
    match: ["Aga Kareba"],
    imageUrl: "/program/Aga_Kareba.jpg",
    description:
      "Program malam santai berisi berita ringan, tips inspiratif, cerita masyarakat, lagu populer, dan interaksi hangat bersama pendengar untuk menutup hari dengan suasana akrab."
  },
  {
    title: "Lasinrang Preneur",
    match: ["Lasinrang Preneur"],
    imageUrl: "/program/Lasinrang_Preneur.jpg",
    description:
      "Talkshow bisnis kreatif yang mengangkat kisah UMKM, pelaku usaha lokal, produk unggulan Pinrang, serta tips bisnis dan kewirausahaan."
  },
  {
    title: "Keluarga Berdaya (PKK)",
    match: ["Keluarga Berdaya", "PKK"],
    imageUrl: "/program/Pinrang_Berkabar.jpg",
    description:
      "Program edukasi keluarga yang membahas parenting, kesehatan, gizi, pemberdayaan perempuan, dan kisah inspiratif keluarga Pinrang."
  },
  {
    title: "Program Religi",
    match: ["Program Religi"],
    imageUrl: "/program/Info_Terkini.jpg",
    description:
      "Program bernuansa Islami yang menghadirkan rekaman tausiah, dakwah, dan lagu religi untuk menambah ketenangan dan wawasan spiritual pendengar."
  },
  {
    title: "Jumat Ceria",
    match: ["Jumat Ceria"],
    imageUrl: "/program/Jumat_Ceria.jpg",
    description:
      "Program edukatif dengan suasana santai dan menyenangkan yang membahas dunia pendidikan, literasi, kreativitas pelajar, dan inspirasi anak muda Pinrang."
  },
  {
    title: "Pinrang Creative Network (PCN)",
    match: ["Pinrang Creative Network", "PCN"],
    imageUrl: "/program/Pinrang_Creative_Network.jpg",
    description:
      "Program kolaborasi komunitas kreatif yang membahas seni, budaya, pendidikan, ekonomi kreatif, dan perkembangan komunitas lokal di Pinrang."
  },
  {
    title: "Pinrang KEREN!",
    match: ["Pinrang KEREN"],
    imageUrl: "/program/Pinrang_Berkabar.jpg",
    description:
      "Program inspiratif yang menghadirkan tokoh, komunitas, dan generasi muda berprestasi untuk berbagi pengalaman, motivasi, dan ide positif bagi masyarakat."
  },
  {
    title: "SBL on Stage",
    match: ["SBL on Stage"],
    imageUrl: "/program/SBL_On_Stage.jpg",
    description:
      "Program hiburan dan live performance yang menghadirkan musik, interaksi pendengar, komunitas kreatif, dan suasana panggung khas Radio SBL."
  },
  {
    title: "Playlist Lagu-Lagu Terbaik",
    match: ["Lagu-lagu Terbaik", "Playlist Lagu-Lagu Terbaik"],
    imageUrl: "/program/Info_Terkini.jpg",
    description:
      "Program auto-playlist pilihan yang memutarkan lagu-lagu terbaik dan segmen favorit sebagai penutup siaran Radio SBL setiap malam."
  },
  {
    title: "SBL Goes to School",
    match: ["SBL Goes to School"],
    imageUrl: "/program/SBL_Goes_To_School.jpg",
    description:
      "Siaran edukatif dan live outdoor broadcasting dari lingkungan sekolah untuk menyapa pelajar, guru, serta komunitas pendidikan Pinrang."
  }
];

function normalizeProgramName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getProgramInfo(programName: string): ProgramInfo {
  const normalizedName = normalizeProgramName(programName);
  const match = programCatalog.find((program) =>
    program.match.some((keyword) => normalizedName.includes(normalizeProgramName(keyword)))
  );

  return match ?? {
    ...programFallbackInfo,
    title: programName || programFallbackInfo.title
  };
}

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
    fullName: "Akhmad Amiruddin",
    airName: "Amar",
    scheduleNames: ["Amar"],
    photoUrl: "/crew/amar.png",
    decreeOrder: 1,
    active: true
  },
  {
    id: "085343820280",
    fullName: "Sulaiman",
    airName: "Sul",
    scheduleNames: ["Sul"],
    photoUrl: "/crew/sul.png",
    decreeOrder: 2,
    active: true
  },
  {
    id: "081342103115",
    fullName: "Wiwik",
    airName: "Wiwik",
    scheduleNames: ["Rena", "Wiwik"],
    photoUrl: "/crew/wiwik.png",
    decreeOrder: 3,
    active: true
  },
  {
    id: "082323334842",
    fullName: "Riska Dwiayanti",
    airName: "Riska",
    scheduleNames: ["Riska"],
    photoUrl: "/crew/riska.png",
    decreeOrder: 4,
    active: true
  },
  {
    id: "085242918411",
    fullName: "St. Rukiah",
    airName: "Ria",
    scheduleNames: ["Ria"],
    photoUrl: "/crew/ria.png",
    decreeOrder: 5,
    active: true
  },
  {
    id: "08114441006",
    fullName: "Salmiah",
    airName: "Miah",
    scheduleNames: ["Miah"],
    photoUrl: "/crew/Miah.png",
    decreeOrder: 6,
    active: true
  },
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
  { id: "emp-hendra", name: "MUHAMMAD CHENDRA BURHAN", role: "Engineer", wa: "085255300670", photoUrl: "/crew/hendra.png" },
  { id: "emp-azhar", name: "ANDI AZHAR", role: "IT", wa: "085156919530", photoUrl: "/crew/azhar.png" },
  { id: "emp-muhas", name: "MUHAMMAD SALEH", role: "Reporter Lapangan", wa: "085242640984", photoUrl: "/crew/muhas.png" },
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
