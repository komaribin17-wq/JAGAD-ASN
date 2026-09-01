import { useState, useEffect, useRef } from "react";
import {
  Shield, BookOpen, TrendingUp, MessageCircle, User, ChevronLeft,
  AlertTriangle, Lock, LogOut, Trash2, CheckCircle2, Sparkles, HeartHandshake,
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ---------- Design tokens ----------
  Palette:
   pine   #12362B  (primary ink / deep brand)
   leaf   #1F7A54  (primary action)
   sage   #EEF2ED  (background)
   paper  #FFFFFF  (cards)
   line   #DCE3DC  (hairline)
   olive  #8A6D1D  (attention / "perlu perhatian")
   brick  #9B3B30  (concern / "perlu pendampingan")
   ink    #16241D  (text)
   mute   #5B6B60  (secondary text)
  Type:
   display: "Fraunces" (serif, civic + warm — the seal/stamp motif's partner)
   body:    "Inter"
   data:    "IBM Plex Mono" (scores, dates, figures)
  Signature: a concentric "segel" (seal) ring — JAGAD as guardian/verifier —
  used for the splash mark, the score dial, and status badges instead of a
  generic progress ring.
------------------------------------ */

const T = {
  pine: "#12362B", leaf: "#1F7A54", leafDeep: "#155C40",
  sage: "#EEF2ED", paper: "#FFFFFF", line: "#DCE3DC",
  olive: "#8A6D1D", oliveBg: "#F5EDD9",
  brick: "#9B3B30", brickBg: "#F6E4E1",
  leafBg: "#E1F0E7",
  ink: "#16241D", mute: "#5B6B60",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

const QUESTIONS = [
  "Dalam 30 hari terakhir, seberapa sering Anda merasa terdorong melakukan aktivitas digital berisiko meskipun sudah berniat berhenti?",
  "Seberapa sulit bagi Anda mengendalikan waktu yang digunakan untuk aktivitas digital yang tidak produktif?",
  "Pernahkah Anda menggunakan uang yang sebenarnya dialokasikan untuk kebutuhan lain karena keputusan digital yang impulsif?",
  "Seberapa sering Anda merasa perlu mengejar kembali kerugian finansial dengan mengambil keputusan berisiko?",
  "Apakah aktivitas digital berisiko pernah mengganggu konsentrasi atau produktivitas kerja?",
  "Apakah Anda pernah menyembunyikan pengeluaran atau aktivitas digital tertentu dari orang yang Anda percaya?",
  "Seberapa sering Anda merasa gelisah ketika tidak dapat mengakses aktivitas digital tertentu?",
  "Apakah Anda merasa membutuhkan dukungan untuk membangun kebiasaan digital dan finansial yang lebih sehat?",
];
const OPTIONS = ["Tidak pernah", "Jarang", "Kadang-kadang", "Sering", "Sangat sering"];

function isValidDate(y, m, d) {
  if (m < 1 || m > 12) return false;
  const dim = new Date(y, m, 0).getDate();
  return d >= 1 && d <= dim;
}

/** Validates structural format of NIK (16 digit) or NIP (18 digit). Does not
 *  check against a real government database — only that the number is not
 *  obviously fabricated (correct length, digits only, embedded date valid). */
function validateIdNumber(raw) {
  const v = (raw || "").trim();
  if (!/^\d+$/.test(v)) return { valid: false, message: "ID pengguna harus berupa angka (tanpa spasi atau huruf)" };

  if (v.length === 16) {
    const dd = parseInt(v.slice(6, 8), 10);
    const mm = parseInt(v.slice(8, 10), 10);
    const yy = parseInt(v.slice(10, 12), 10);
    const day = dd > 40 ? dd - 40 : dd; // NIK menambah 40 pada tanggal lahir untuk perempuan
    const year = 2000 + yy <= new Date().getFullYear() ? 2000 + yy : 1900 + yy;
    if (!isValidDate(year, mm, day)) {
      return { valid: false, message: "NIK tidak valid: 6 digit tanggal lahir pada NIK tidak sesuai format" };
    }
    return { valid: true, type: "NIK" };
  }

  if (v.length === 18) {
    const y = parseInt(v.slice(0, 4), 10);
    const m = parseInt(v.slice(4, 6), 10);
    const d = parseInt(v.slice(6, 8), 10);
    const gender = v[14];
    if (!isValidDate(y, m, d) || y < 1940 || y > new Date().getFullYear() - 17) {
      return { valid: false, message: "NIP tidak valid: 8 digit tanggal lahir pada NIP tidak sesuai format" };
    }
    if (gender !== "1" && gender !== "2") {
      return { valid: false, message: "NIP tidak valid: digit penanda jenis kelamin harus 1 atau 2" };
    }
    return { valid: true, type: "NIP" };
  }

  return { valid: false, message: "ID pengguna harus 16 digit (NIK) atau 18 digit (NIP)" };
}


  if (score < 30) return { key: "low", label: "Risiko rendah", color: T.leaf, bg: T.leafBg,
    text: "Pertahankan kebiasaan digital dan finansial yang sehat.",
    rec: ["Lanjutkan kebiasaan digital sehat", "Lakukan screening berkala", "Bagikan edukasi kepada rekan kerja"] };
  if (score < 60) return { key: "mid", label: "Perlu perhatian", color: T.olive, bg: T.oliveBg,
    text: "Ada beberapa indikator yang layak diperhatikan dan dipantau.",
    rec: ["Ikuti modul edukasi di JAGAD EDU", "Atur batas penggunaan gawai", "Lakukan screening ulang secara berkala"] };
  return { key: "high", label: "Perlu pendampingan", color: T.brick, bg: T.brickBg,
    text: "Hasil ini bukan diagnosis atau bukti perilaku. Pertimbangkan mencari dukungan yang sesuai.",
    rec: ["Gunakan JAGAD CARE untuk informasi dukungan", "Pertimbangkan berbicara dengan pihak terpercaya", "Lakukan screening ulang setelah mendapat dukungan"] };
}

/* Seal / segel — the signature motif */
function Seal({ size = 96, color = T.leaf, thickness = 3, dashed = true, children }) {
  const r1 = size / 2 - thickness;
  const r2 = r1 - 10;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r1} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={dashed ? "2 7" : "none"} strokeLinecap="round" opacity="0.55" />
        <circle cx={size / 2} cy={size / 2} r={r2} fill="none" stroke={color} strokeWidth={thickness} opacity="0.9" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div style={{
      position: "absolute", left: "50%", bottom: 92, transform: "translateX(-50%)",
      background: T.ink, color: "#fff", padding: "11px 18px", borderRadius: 12,
      fontSize: 13, fontFamily: "Inter, sans-serif", zIndex: 40, whiteSpace: "nowrap",
      boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    }}>{text}</div>
  );
}

function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div style={{ padding: "22px 20px 6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {onBack && (
            <button onClick={onBack} style={{ border: 0, background: "none", cursor: "pointer", padding: 4, marginLeft: -6, color: T.pine }}>
              <ChevronLeft size={22} />
            </button>
          )}
          <h2 style={{ margin: 0, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 24, color: T.pine }}>{title}</h2>
        </div>
        {right}
      </div>
      {subtitle && <p style={{ margin: "7px 0 0", color: T.mute, fontSize: 14, fontFamily: "Inter, sans-serif" }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.paper, border: `1px solid ${T.line}`, borderRadius: 18,
      padding: 18, margin: "12px 20px", boxShadow: "0 8px 24px rgba(18,54,43,.06)",
      fontFamily: "Inter, sans-serif", ...style,
    }}>{children}</div>
  );
}

function Badge({ children, color = T.leaf, bg = T.leafBg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px",
      borderRadius: 999, fontSize: 12, fontWeight: 700, background: bg, color,
      fontFamily: "Inter, sans-serif",
    }}>{children}</span>
  );
}

function PrimaryBtn({ children, onClick, style, variant = "primary" }) {
  const styles = {
    primary: { background: T.leaf, color: "#fff" },
    light: { background: "#fff", color: T.pine },
    outline: { background: "transparent", color: T.pine, border: `1.5px solid ${T.line}` },
    ghostLight: { background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.45)" },
  };
  return (
    <button onClick={onClick} style={{
      border: 0, borderRadius: 14, padding: "14px 18px", fontWeight: 700, fontSize: 15,
      cursor: "pointer", width: "100%", marginTop: 10, fontFamily: "Inter, sans-serif",
      transition: "transform .12s ease", ...styles[variant], ...style,
    }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(.98)"}
    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >{children}</button>
  );
}

function BottomNav({ screen, go }) {
  const items = [
    { id: "home", icon: Shield, label: "Beranda" },
    { id: "trend", icon: TrendingUp, label: "Trend" },
    { id: "edu", icon: BookOpen, label: "Edukasi" },
    { id: "profile", icon: User, label: "Profil" },
  ];
  return (
    <nav style={{
      position: "absolute", left: 0, right: 0, bottom: 0, background: T.paper,
      borderTop: `1px solid ${T.line}`, height: 74, display: "flex",
      justifyContent: "space-around", alignItems: "center", zIndex: 5,
    }}>
      {items.map(({ id, icon: Icon, label }) => {
        const active = screen === id;
        return (
          <button key={id} onClick={() => go(id)} style={{
            border: 0, background: "none", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, cursor: "pointer",
            color: active ? T.leaf : T.mute, fontFamily: "Inter, sans-serif",
          }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function JagadASN() {
  const [screen, setScreen] = useState("splash");
  const [prevScreen, setPrevScreen] = useState("splash");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const [profile, setProfile] = useState({ name: "", id: "", opd: "", email: "" });
  const [regDraft, setRegDraft] = useState({ name: "", id: "", opd: "", email: "", password: "" });
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [employees, setEmployees] = useState(null); // null = belum dimuat
  const [adminLoading, setAdminLoading] = useState(false);

  const [history, setHistory] = useState(null); // null = loading
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  function showToast(t) {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }

  function go(id) {
    setPrevScreen(screen);
    setScreen(id);
  }

  const [authLoading, setAuthLoading] = useState(true);

  // Memuat sesi login yang sedang berjalan (kalau ada) + profil & riwayat dari Supabase.
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await loadOwnProfileAndHistory(session.user.id);
      setAuthLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setProfile({ name: "", id: "", opd: "", email: "" }); setHistory([]); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadOwnProfileAndHistory(userId) {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (p) setProfile({ name: p.name, id: p.nik_nip, idType: p.id_type, opd: p.opd, registered: true, isAdmin: p.is_admin });
    const { data: c } = await supabase.from("checkins").select("score, checkin_date").eq("profile_id", userId).order("created_at", { ascending: true });
    setHistory((c || []).map(r => ({ score: r.score, date: r.checkin_date })));
  }

  async function saveCheckin(entry) {
    setHistory([...(history || []), entry].slice(-12));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("checkins").insert({ profile_id: user.id, score: entry.score, checkin_date: entry.date });
  }

  async function loadEmployees() {
    setAdminLoading(true);
    // RLS memastikan query ini hanya berhasil kalau akun yang login is_admin = true.
    const { data, error } = await supabase
      .from("profiles")
      .select("name, nik_nip, id_type, opd, checkins(score, checkin_date)")
      .eq("is_admin", false);
    if (error) {
      setEmployees([]);
    } else {
      const records = (data || []).map(p => ({
        name: p.name, id: p.nik_nip, idType: p.id_type, opd: p.opd,
        checkins: (p.checkins || []).sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
          .map(c => ({ score: c.score, date: c.checkin_date })),
        updatedAt: p.checkins?.length ? p.checkins[p.checkins.length - 1].checkin_date : "",
      }));
      records.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      setEmployees(records);
    }
    setAdminLoading(false);
  }

  async function handleAdminLogin() {
    if (!adminId.trim() || !adminPassword.trim()) { showToast("Masukkan ID admin dan password"); return; }
    const { data: found } = await supabase.from("profiles").select("id, is_admin").eq("nik_nip", adminId.trim()).maybeSingle();
    if (!found) { showToast("Akun admin tidak ditemukan"); return; }
    const email = `${adminId.trim()}@jagad-asn.local`; // lihat catatan pemetaan email di README
    const { error } = await supabase.auth.signInWithPassword({ email, password: adminPassword });
    if (error) { showToast("ID atau password admin salah"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!prof?.is_admin) { showToast("Akun ini bukan admin"); await supabase.auth.signOut(); return; }
    loadEmployees();
    go("adminDashboard");
  }

  async function clearData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("checkins").delete().eq("profile_id", user.id);
    setHistory([]);
    showToast("Riwayat screening dihapus");
  }

  // Supabase Auth berbasis email, jadi NIK/NIP dipetakan ke alamat email internal.
  // Kalau pegawai punya email instansi asli, ganti baris ini agar memakai email tersebut.
  function emailFromId(id) {
    return `${id}@jagad-asn.local`;
  }

  async function handleRegister() {
    if (!regDraft.name.trim() || !regDraft.id.trim() || !regDraft.password.trim()) {
      showToast("Lengkapi nama, ID pengguna, dan password terlebih dahulu");
      return;
    }
    const check = validateIdNumber(regDraft.id);
    if (!check.valid) { showToast(check.message); return; }
    const id = regDraft.id.trim();
    const { data: existing } = await supabase.from("profiles").select("id").eq("nik_nip", id).maybeSingle();
    if (existing) { showToast("NIK/NIP ini sudah terdaftar"); return; }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: emailFromId(id), password: regDraft.password,
    });
    if (signUpError || !signUpData.user) { showToast(signUpError?.message || "Pendaftaran gagal"); return; }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: signUpData.user.id, name: regDraft.name, nik_nip: id, id_type: check.type,
      opd: regDraft.opd || "OPD belum diisi",
    });
    if (profileError) { showToast("Gagal menyimpan profil: " + profileError.message); return; }

    showToast(`Akun berhasil dibuat (${check.type} tervalidasi), silakan masuk`);
    setLoginId(id);
    setLoginPassword("");
    await supabase.auth.signOut(); // pastikan harus login manual, bukan auto-masuk
    go("login");
  }

  async function handleLogin() {
    if (!loginId.trim() || !loginPassword.trim()) { showToast("Masukkan ID pengguna dan password"); return; }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailFromId(loginId.trim()), password: loginPassword,
    });
    if (error) { showToast("ID pengguna atau password salah"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await loadOwnProfileAndHistory(user.id);
    go("home");
  }

  function startCheck() {
    setQi(0);
    setAnswers([]);
    go("check");
  }

  function selectOpt(i) {
    const next = [...answers];
    next[qi] = i;
    setAnswers(next);
  }

  function nextQ() {
    if (answers[qi] === undefined) { showToast("Pilih salah satu jawaban terlebih dahulu"); return; }
    if (qi < QUESTIONS.length - 1) { setQi(qi + 1); return; }
    const raw = answers.reduce((a, b) => a + b, 0);
    const score = Math.round((raw / (4 * QUESTIONS.length)) * 100);
    const result = { score, date: new Date().toISOString().slice(0, 10) };
    setLastResult(result);
    saveCheckin(result);
    go("result");
  }

  function prevQ() {
    if (qi === 0) { go("home"); return; }
    setQi(qi - 1);
  }

  const latest = history && history.length ? history[history.length - 1] : null;
  const progressPct = ((qi + (answers[qi] !== undefined ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div style={{
      width: "min(430px, 100%)", minHeight: 640, maxHeight: 780, margin: "0 auto",
      background: T.sage, position: "relative", overflow: "hidden",
      borderRadius: 28, boxShadow: "0 24px 60px rgba(18,54,43,.18)",
      border: `1px solid ${T.line}`, fontFamily: "Inter, sans-serif",
    }}>
      <style>{FONTS}</style>
      <div style={{ height: 640, maxHeight: 780, overflowY: "auto", position: "relative", paddingBottom: screen !== "splash" && screen !== "login" && screen !== "register" ? 84 : 0 }}>

        {screen === "splash" && (
          <div style={{
            minHeight: 640, background: `radial-gradient(120% 100% at 50% -10%, ${T.leafDeep} 0%, ${T.pine} 60%, #0B241B 100%)`,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,.06) 1px, transparent 0)`,
            backgroundSize: "18px 18px",
          }}>
            <div style={{ padding: 28 }}>
              <div style={{ margin: "0 auto 20px" }}>
                <Seal size={100} color="rgba(255,255,255,.9)" thickness={2}>
                  <Shield size={40} strokeWidth={1.6} />
                </Seal>
              </div>
              <h1 style={{ margin: 0, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 32, letterSpacing: ".2px" }}>JAGAD ASN</h1>
              <div style={{ opacity: .85, marginTop: 8, fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
                Deteksi Dini • Edukasi • Perlindungan
              </div>
              <p style={{ marginTop: 24, lineHeight: 1.6, opacity: .9, fontSize: 14.5 }}>
                Platform preventif untuk membantu ASN membangun kebiasaan digital dan finansial yang sehat.
              </p>
              <PrimaryBtn variant="light" onClick={() => go("login")}>Masuk</PrimaryBtn>
              <PrimaryBtn variant="ghostLight" onClick={() => go("register")}>Daftar Akun</PrimaryBtn>
              <p style={{ marginTop: 16, fontSize: 12.5, opacity: .75, cursor: "pointer" }} onClick={() => go("adminLogin")}>
                Masuk sebagai Admin
              </p>
            </div>
          </div>
        )}

        {screen === "login" && (
          <div>
            <TopBar title="Masuk" subtitle="Akses dashboard pribadi JAGAD ASN." onBack={() => go("splash")} />
            <Card>
              <label style={lbl}>ID Pengguna (NIK/NIP)</label>
              <input style={inp} placeholder="Masukkan NIK atau NIP" value={loginId} onChange={e => setLoginId(e.target.value)} />
              <label style={lbl}>Password</label>
              <input style={inp} type="password" placeholder="Masukkan password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <PrimaryBtn onClick={handleLogin}>Masuk</PrimaryBtn>
              <p style={{ textAlign: "center", color: T.mute, fontSize: 13.5, marginTop: 14 }}>
                Belum punya akun?{" "}
                <span style={{ color: T.leaf, fontWeight: 700, cursor: "pointer" }} onClick={() => go("register")}>Daftar sekarang</span>
              </p>
            </Card>
          </div>
        )}

        {screen === "register" && (
          <div>
            <TopBar title="Buat Akun" subtitle="Prototype mandiri untuk kebutuhan demonstrasi." onBack={() => go("splash")} />
            <Card>
              <label style={lbl}>Nama Lengkap</label>
              <input style={inp} placeholder="Nama lengkap" value={regDraft.name} onChange={e => setRegDraft({ ...regDraft, name: e.target.value })} />
              <label style={lbl}>ID Pengguna (NIK/NIP)</label>
              <input style={inp} placeholder="Masukkan NIK atau NIP" maxLength={18} value={regDraft.id} onChange={e => setRegDraft({ ...regDraft, id: e.target.value.replace(/\D/g, "") })} />
              <small style={{ color: T.mute, fontSize: 11.5 }}>16 digit untuk NIK, 18 digit untuk NIP — hanya angka.</small>
              <label style={lbl}>OPD / Instansi</label>
              <input style={inp} placeholder="Contoh: Dinas Pendidikan" value={regDraft.opd} onChange={e => setRegDraft({ ...regDraft, opd: e.target.value })} />
              <label style={lbl}>Email</label>
              <input style={inp} type="email" placeholder="nama@email.com" value={regDraft.email} onChange={e => setRegDraft({ ...regDraft, email: e.target.value })} />
              <label style={lbl}>Password</label>
              <input style={inp} type="password" placeholder="Minimal 8 karakter" value={regDraft.password} onChange={e => setRegDraft({ ...regDraft, password: e.target.value })} />
              <PrimaryBtn onClick={handleRegister}>Buat Akun</PrimaryBtn>
            </Card>
          </div>
        )}

        {screen === "adminLogin" && (
          <div>
            <TopBar title="Login Admin" subtitle="Khusus pengelola JAGAD ASN di instansi." onBack={() => go("splash")} />
            <Card style={{ background: T.pine, color: "#fff", border: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Lock size={18} />
                <small style={{ opacity: .85, lineHeight: 1.5 }}>Halaman ini menampilkan data seluruh pegawai yang telah mengisi JAGAD CHECK. Akses dibatasi untuk admin resmi.</small>
              </div>
            </Card>
            <Card>
              <label style={lbl}>ID Admin</label>
              <input style={inp} placeholder="ID admin" value={adminId} onChange={e => setAdminId(e.target.value)} />
              <label style={lbl}>Password</label>
              <input style={inp} type="password" placeholder="Password admin" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
              <PrimaryBtn onClick={handleAdminLogin}>Masuk sebagai Admin</PrimaryBtn>
              <p style={{ color: T.mute, fontSize: 11.5, marginTop: 10 }}>Login pakai NIK/NIP yang sudah ditandai sebagai admin di database (lihat schema.sql).</p>
            </Card>
          </div>
        )}

        {screen === "adminDashboard" && (
          <div>
            <TopBar
              title="Dashboard Admin"
              subtitle="Daftar pegawai yang telah mengisi JAGAD CHECK."
              onBack={async () => { await supabase.auth.signOut(); go("splash"); }}
              right={<button onClick={loadEmployees} style={{ border: `1px solid ${T.line}`, background: "none", borderRadius: 10, padding: "6px 10px", fontSize: 12, cursor: "pointer", color: T.pine }}>Muat ulang</button>}
            />
            {adminLoading && <Card><p style={{ color: T.mute, fontSize: 13.5 }}>Memuat data pegawai...</p></Card>}
            {!adminLoading && employees && employees.length === 0 && (
              <Card><p style={{ color: T.mute, fontSize: 13.5 }}>Belum ada pegawai yang mengisi JAGAD CHECK.</p></Card>
            )}
            {!adminLoading && employees && employees.length > 0 && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <b style={{ fontSize: 14.5 }}>Total pegawai</b>
                  <Badge>{employees.length} orang</Badge>
                </div>
              </Card>
            )}
            {!adminLoading && employees && employees.map((emp) => {
              const last = emp.checkins?.[emp.checkins.length - 1];
              const b = last ? band(last.score) : null;
              return (
                <Card key={emp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <b style={{ fontSize: 14.5 }}>{emp.name}</b>
                      <p style={{ color: T.mute, fontSize: 12.5, margin: "4px 0 0" }}>{emp.opd || "OPD tidak diisi"}</p>
                      <p style={{ color: T.mute, fontSize: 11.5, fontFamily: "IBM Plex Mono, monospace", margin: "3px 0 0" }}>{emp.idType || "ID"}: {emp.id}</p>
                    </div>
                    {b && <Badge color={b.color} bg={b.bg}>{b.label}</Badge>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, color: T.mute }}>
                    <span>Skor terakhir: <b style={{ color: T.ink, fontFamily: "IBM Plex Mono, monospace" }}>{last?.score ?? "-"}</b></span>
                    <span>{emp.checkins?.length || 0}x screening</span>
                    <span>{last?.date || "-"}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {screen === "home" && (
          <div>
            <TopBar
              title="JAGAD ASN"
              right={<Badge>AMAN</Badge>}
            />
            <p style={{ margin: "0 20px", color: T.mute, fontSize: 14 }}>Selamat datang, {profile.name || "Pengguna"} 👋</p>
            <Card style={{ background: `linear-gradient(135deg, ${T.pine}, ${T.leafDeep})`, color: "#fff", border: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Seal size={62} color="rgba(255,255,255,.85)" thickness={2}>
                  <Shield size={24} strokeWidth={1.6} />
                </Seal>
                <div>
                  <div style={{ fontSize: 12, opacity: .8, letterSpacing: ".5px", textTransform: "uppercase", fontWeight: 700 }}>Status digital Anda</div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                    {latest ? band(latest.score).label : "Screening belum dilakukan"}
                  </div>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,.85)", fontSize: 13.5, marginTop: 12 }}>
                {latest ? `Terakhir screening: ${latest.date} · skor ${latest.score}` : "Kenali pola kebiasaan digital Anda secara rahasia dan preventif."}
              </p>
              <PrimaryBtn variant="light" onClick={startCheck}>{latest ? "Ulangi JAGAD CHECK" : "Mulai JAGAD CHECK"}</PrimaryBtn>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "12px 20px" }}>
              {[
                { icon: Shield, title: "JAGAD CHECK", sub: "Screening risiko", act: startCheck },
                { icon: BookOpen, title: "JAGAD EDU", sub: "Edukasi digital", act: () => go("edu") },
                { icon: TrendingUp, title: "JAGAD TREND", sub: "Perkembangan skor", act: () => go("trend") },
                { icon: MessageCircle, title: "JAGAD CARE", sub: "Info bantuan", act: () => go("care") },
              ].map(({ icon: Icon, title, sub, act }) => (
                <div key={title} onClick={act} style={{
                  background: T.paper, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, cursor: "pointer",
                }}>
                  <Icon size={22} color={T.leaf} strokeWidth={1.8} />
                  <b style={{ display: "block", marginTop: 9, fontSize: 14.5 }}>{title}</b>
                  <small style={{ color: T.mute, display: "block", marginTop: 3, fontSize: 12.5 }}>{sub}</small>
                </div>
              ))}
            </div>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: 14.5 }}>Prinsip JAGAD ASN</b>
                <Lock size={16} color={T.mute} />
              </div>
              <p style={{ color: T.mute, fontSize: 13, marginTop: 8, lineHeight: 1.55 }}>
                Hasil screening bukan bukti seseorang berjudi. Sistem hanya memberikan indikasi risiko untuk tujuan pencegahan dan edukasi.
              </p>
            </Card>
            <BottomNav screen={screen} go={go} />
          </div>
        )}

        {screen === "check" && (
          <div>
            <div style={{ padding: "22px 20px 6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={prevQ} style={{ border: 0, background: "none", cursor: "pointer", padding: 4, marginLeft: -6, color: T.pine }}>
                  <ChevronLeft size={22} />
                </button>
                <b style={{ fontFamily: "Inter, sans-serif", fontSize: 14 }}>JAGAD CHECK</b>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: T.mute }}>{qi + 1}/{QUESTIONS.length}</span>
              </div>
              <div style={{ height: 8, background: T.line, borderRadius: 8, overflow: "hidden", marginTop: 12 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: T.leaf, transition: "width .25s ease" }} />
              </div>
            </div>
            <Card>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.45, fontFamily: "Fraunces, serif" }}>{QUESTIONS[qi]}</div>
              <div style={{ marginTop: 6 }}>
                {OPTIONS.map((o, i) => {
                  const sel = answers[qi] === i;
                  return (
                    <div key={o} onClick={() => selectOpt(i)} style={{
                      border: `1.5px solid ${sel ? T.leaf : T.line}`, background: sel ? T.leafBg : "transparent",
                      padding: "13px 14px", borderRadius: 13, marginTop: 9, cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14.5,
                    }}>
                      {o}
                      {sel && <CheckCircle2 size={18} color={T.leaf} />}
                    </div>
                  );
                })}
              </div>
              <PrimaryBtn onClick={nextQ}>{qi === QUESTIONS.length - 1 ? "Lihat Hasil" : "Lanjut"}</PrimaryBtn>
            </Card>
            <BottomNav screen="check-active" go={go} />
          </div>
        )}

        {screen === "result" && lastResult && (() => {
          const b = band(lastResult.score);
          return (
            <div>
              <TopBar title="Hasil JAGAD CHECK" subtitle="Hasil screening bersifat preventif dan pribadi." />
              <Card style={{ textAlign: "center" }}>
                <Seal size={128} color={b.color} thickness={3}>
                  <div>
                    <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: 34, color: T.pine }}>{lastResult.score}</div>
                    <div style={{ fontSize: 10, color: T.mute, letterSpacing: ".5px" }}>SKOR</div>
                  </div>
                </Seal>
                <div style={{ marginTop: 14 }}><Badge color={b.color} bg={b.bg}>{b.label}</Badge></div>
                <p style={{ color: T.mute, fontSize: 13.5, marginTop: 12, lineHeight: 1.55 }}>{b.text}</p>
              </Card>
              <Card>
                <b style={{ fontSize: 14.5 }}>Rekomendasi</b>
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: T.ink, fontSize: 13.5, lineHeight: 1.9 }}>
                  {b.rec.map(r => <li key={r}>{r}</li>)}
                </ul>
              </Card>
              <div style={{ padding: "4px 20px 20px" }}>
                <PrimaryBtn onClick={() => go("trend")}>Lihat JAGAD TREND</PrimaryBtn>
                <PrimaryBtn variant="outline" onClick={() => go("home")}>Kembali ke Beranda</PrimaryBtn>
              </div>
            </div>
          );
        })()}

        {screen === "trend" && (
          <div>
            <TopBar title="JAGAD TREND" subtitle="Perkembangan hasil screening Anda." />
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: 14.5 }}>Skor Risiko</b>
                <Badge>{history?.length || 0} periode</Badge>
              </div>
              {history && history.length > 0 ? (
                <>
                  <div style={{ height: 150, display: "flex", alignItems: "flex-end", gap: 10, padding: "20px 4px 0" }}>
                    {history.slice(-6).map((h, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: T.mute, marginBottom: 4 }}>{h.score}</div>
                        <div style={{
                          height: Math.max(10, h.score) + "px", background: band(h.score).color,
                          borderRadius: "8px 8px 3px 3px", opacity: idx === history.slice(-6).length - 1 ? 1 : .55,
                        }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    {history.slice(-6).map((h, idx) => (
                      <small key={idx} style={{ color: T.mute, fontSize: 10.5, flex: 1, textAlign: "center" }}>{h.date.slice(5)}</small>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <p style={{ color: T.mute, fontSize: 13.5 }}>Belum ada riwayat screening.</p>
                  <PrimaryBtn onClick={startCheck}>Mulai JAGAD CHECK</PrimaryBtn>
                </div>
              )}
            </Card>
            {history && history.length > 0 && (
              <Card>
                <b style={{ fontSize: 14.5 }}>Insight</b>
                <p style={{ color: T.mute, fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
                  {history.length < 2
                    ? "Lakukan screening berkala agar tren dapat terlihat lebih jelas."
                    : history[history.length - 1].score > history[history.length - 2].score
                      ? "Skor risiko meningkat dibanding periode sebelumnya. Pertimbangkan meninjau kembali kebiasaan digital Anda."
                      : history[history.length - 1].score < history[history.length - 2].score
                        ? "Skor risiko menurun dibanding periode sebelumnya. Pertahankan kebiasaan baik ini."
                        : "Skor risiko stabil dibanding periode sebelumnya."}
                </p>
              </Card>
            )}
            <BottomNav screen={screen} go={go} />
          </div>
        )}

        {screen === "edu" && (
          <div>
            <TopBar title="JAGAD EDU" subtitle="Pengetahuan singkat untuk menjaga kesehatan digital." />
            <Card><b style={{ fontSize: 14.5 }}>🎯 Kenali pola risiko</b><p style={{ color: T.mute, fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>Dorongan mengejar kerugian, sulit mengendalikan aktivitas digital, dan dampak terhadap pekerjaan dapat menjadi sinyal untuk berhenti sejenak dan mencari dukungan.</p></Card>
            <Card><b style={{ fontSize: 14.5 }}>💳 Jaga keamanan finansial</b><p style={{ color: T.mute, fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>Gunakan anggaran yang jelas, hindari keputusan finansial impulsif, dan waspadai tawaran digital yang menjanjikan keuntungan cepat.</p></Card>
            <Card><b style={{ fontSize: 14.5 }}>📱 Digital sehat</b><p style={{ color: T.mute, fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>Atur waktu penggunaan gawai dan pilih aktivitas digital yang mendukung produktivitas serta kesejahteraan.</p></Card>
            <BottomNav screen={screen} go={go} />
          </div>
        )}

        {screen === "care" && (
          <div>
            <TopBar title="JAGAD CARE" subtitle="Ruang informasi dan dukungan." onBack={() => go(prevScreen === "care" ? "home" : prevScreen)} />
            <Card>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <HeartHandshake size={20} color={T.leaf} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <b style={{ fontSize: 14.5 }}>Butuh dukungan?</b>
                  <p style={{ color: T.mute, fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>Jika aktivitas digital mulai mengganggu pekerjaan, keuangan, atau kehidupan sehari-hari, pertimbangkan berbicara dengan pihak yang dipercaya atau layanan profesional yang tersedia di instansi.</p>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Lock size={20} color={T.leaf} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <b style={{ fontSize: 14.5 }}>Kerahasiaan</b>
                  <p style={{ color: T.mute, fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>Prototype ini tidak membaca isi pesan, galeri, rekening, atau aktivitas pribadi di perangkat.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {screen === "profile" && (
          <div>
            <TopBar title="Profil Saya" subtitle="Pengaturan akun prototype." />
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <b style={{ fontSize: 15 }}>{profile.name || "Pengguna JAGAD"}</b>
                  <p style={{ color: T.mute, margin: "5px 0 0", fontSize: 13 }}>{profile.opd || "ASN"} · {profile.id ? `ID ${profile.id}` : "Prototype"}</p>
                </div>
                <Seal size={48} color={T.leaf} thickness={2}><User size={18} color={T.leaf} /></Seal>
              </div>
            </Card>
            <Card>
              <b style={{ fontSize: 14.5 }}>Privasi & Data</b>
              <p style={{ color: T.mute, fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>Data screening digunakan untuk feedback pribadi pada prototype. Integrasi dengan sistem kepegawaian resmi dapat dilakukan pada tahap implementasi.</p>
            </Card>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <b style={{ fontSize: 14.5 }}>Riwayat tersimpan</b>
                  <p style={{ color: T.mute, fontSize: 12.5, marginTop: 4 }}>{history?.length || 0} hasil screening di perangkat ini</p>
                </div>
                <button onClick={clearData} style={{ border: `1px solid ${T.brick}`, background: "none", color: T.brick, borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, cursor: "pointer" }}>
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </Card>
            <div style={{ padding: "4px 20px 20px" }}>
              <PrimaryBtn variant="outline" onClick={async () => { await supabase.auth.signOut(); go("splash"); }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center", width: "100%" }}><LogOut size={15} /> Keluar</span>
              </PrimaryBtn>
            </div>
            <BottomNav screen={screen} go={go} />
          </div>
        )}

        <Toast text={toast} />
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 12.5, fontWeight: 700, marginTop: 14, color: T.ink };
const inp = {
  width: "100%", padding: "12.5px 14px", border: "1px solid #cfd8d1", borderRadius: 12,
  marginTop: 7, background: "#fff", fontSize: 14.5, fontFamily: "Inter, sans-serif", color: T.ink,
};
