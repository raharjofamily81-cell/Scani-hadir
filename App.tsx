
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Student, AttendanceRecord, SchoolProfile, Teacher, AdminMember } from './types';
import { StorageService } from './services/storage';
import { WhatsAppService } from './services/whatsappService';
import QRScanner from './components/QRScanner';
import QRCode from 'https://esm.sh/qrcode';
import { 
  HomeIcon, 
  QrCodeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  BuildingLibraryIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  Cog6ToothIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  AcademicCapIcon,
  HandThumbUpIcon,
  ClockIcon as ClockIconOutline,
  CloudArrowUpIcon,
  PhotoIcon as PhotoIconSolid,
  Squares2X2Icon,
  HashtagIcon,
  CameraIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const colorStyles: Record<string, { bg: string, text: string, border: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-indigo-100' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' }
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(StorageService.getSchoolProfile());
  
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({ name: '', class: '', parentName: '', parentPhone: '', photo: '' });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newTeacher, setNewTeacher] = useState<Omit<Teacher, 'id'>>({ name: '', nip: '', subject1: '', subject2: '', subject3: '', extraDuty: '' });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState<Omit<AdminMember, 'id'>>({ name: '', nip: '', role: '' });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [scanType, setScanType] = useState<'HADIR' | 'PULANG'>('HADIR');
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [tendikSearch, setTendikSearch] = useState('');
  const [reportFilterDate, setReportFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'info' | 'error' | 'sending' } | null>(null);

  // Belajar View States
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [manualStatuses, setManualStatuses] = useState<Record<string, 'SAKIT' | 'IJIN' | 'ALPHA' | 'PRESENT'>>({});

  useEffect(() => {
    setStudents(StorageService.getStudents());
    setTeachers(StorageService.getTeachers());
    setAdmins(StorageService.getAdmins());
    setAttendance(StorageService.getAttendance());
    setSchoolProfile(StorageService.getSchoolProfile());
  }, []);

  // Ambil daftar kelas yang valid dari profil sekolah (Tingkat + Rombel)
  const availableSchoolClasses = useMemo(() => {
    const limit = parseInt(schoolProfile.roomCount) || 1;
    return schoolProfile.classes
      .slice(0, limit)
      .map((c, i) => {
        const rombel = schoolProfile.rombels[i] || '';
        return (c && rombel) ? `${c} ${rombel}` : c || rombel || '';
      })
      .filter(c => c !== '');
  }, [schoolProfile]);

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    teachers.forEach(t => {
      if (t.subject1) subs.add(t.subject1);
      if (t.subject2) subs.add(t.subject2);
      if (t.subject3) subs.add(t.subject3);
    });
    return Array.from(subs).sort();
  }, [teachers]);

  const filteredStudents = useMemo(() => 
    students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.class.toLowerCase().includes(studentSearch.toLowerCase())),
    [students, studentSearch]
  );

  const belajarStudents = useMemo(() => 
    students.filter(s => s.class === selectedClass),
    [students, selectedClass]
  );

  const filteredTeachers = useMemo(() => 
    teachers.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase())),
    [teachers, teacherSearch]
  );

  const filteredAdmins = useMemo(() => 
    admins.filter(a => a.name.toLowerCase().includes(tendikSearch.toLowerCase())),
    [admins, tendikSearch]
  );

  const filteredAttendance = useMemo(() => 
    attendance.filter(a => new Date(a.timestamp).toISOString().split('T')[0] === reportFilterDate),
    [attendance, reportFilterDate]
  );

  const isAdminView = ['ADMIN', 'TENDIK', 'TEACHERS', 'STUDENTS', 'SCHOOL_PROFILE', 'SYSTEM_SETTINGS'].includes(activeView);

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'districtLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSchoolProfile(prev => ({
        ...prev,
        [field]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleStudentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewStudent(prev => ({
        ...prev,
        photo: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    StorageService.saveSchoolProfile(schoolProfile);
    setTimeout(() => { setIsSavingProfile(false); alert("Pengaturan berhasil disimpan."); }, 600);
  };

  const handleClassChange = (index: number, value: string) => {
    const updatedClasses = [...schoolProfile.classes];
    updatedClasses[index] = value;
    setSchoolProfile({ ...schoolProfile, classes: updatedClasses });
  };

  const handleRombelChange = (index: number, value: string) => {
    const updatedRombels = [...schoolProfile.rombels];
    updatedRombels[index] = value;
    setSchoolProfile({ ...schoolProfile, rombels: updatedRombels });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.class) return;
    let updated: Student[];
    if (editingStudentId) {
      updated = students.map(s => s.id === editingStudentId ? { ...newStudent, id: s.id } : s);
      setEditingStudentId(null);
    } else {
      const student: Student = { ...newStudent, id: 'ST' + Math.random().toString(36).substr(2, 6).toUpperCase() };
      updated = [...students, student];
    }
    setStudents(updated);
    StorageService.saveStudents(updated);
    setNewStudent({ name: '', class: '', parentName: '', parentPhone: '', photo: '' });
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Teacher[];
    if (editingTeacherId) {
      updated = teachers.map(t => t.id === editingTeacherId ? { ...newTeacher, id: t.id } : t);
      setEditingTeacherId(null);
    } else {
      updated = [...teachers, { ...newTeacher, id: 'TCH' + Date.now().toString().slice(-4) }];
    }
    setTeachers(updated);
    StorageService.saveTeachers(updated);
    setNewTeacher({ name: '', nip: '', subject1: '', subject2: '', subject3: '', extraDuty: '' });
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: AdminMember[];
    if (editingAdminId) {
      updated = admins.map(a => a.id === editingAdminId ? { ...newAdmin, id: a.id } : a);
      setEditingAdminId(null);
    } else {
      updated = [...admins, { ...newAdmin, id: 'ADM' + Date.now().toString().slice(-4) }];
    }
    setAdmins(updated);
    StorageService.saveAdmins(updated);
    setNewAdmin({ name: '', nip: '', role: '' });
  };

  const handleQRScan = (studentId: string) => {
    if (scanMessage) return;

    // Cek apakah sudah terekam hari ini untuk tipe scan yang sama
    const today = new Date().toISOString().split('T')[0];
    const isAlreadyScanned = attendance.some(a => 
      a.studentId === studentId && 
      a.scanType === scanType && 
      a.timestamp.startsWith(today)
    );

    if (isAlreadyScanned) {
      setScanMessage({ text: "DATA SUDAH TEREKAM", type: 'info' });
      setTimeout(() => setScanMessage(null), 2500);
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      setScanMessage({ text: "ID TIDAK DIKENALI", type: 'error' });
      setTimeout(() => setScanMessage(null), 2000); 
      return;
    }

    const record: AttendanceRecord = { 
      id: Date.now().toString(), 
      studentId: student.id, 
      studentName: student.name, 
      className: student.class, 
      timestamp: new Date().toISOString(), 
      status: 'PRESENT', 
      scanType 
    };

    StorageService.addAttendance(record);
    setAttendance(prev => [record, ...prev]);

    // Jika scan PULANG, berikan feedback khusus pengiriman WA
    if (scanType === 'PULANG') {
      setScanMessage({ text: `LAPORAN PULANG DIKIRIM: ${student.name}`, type: 'sending' });
      WhatsAppService.sendAttendanceReport(student, record);
    } else {
      setScanMessage({ text: `HADIR BERHASIL: ${student.name}`, type: 'success' });
      WhatsAppService.sendAttendanceReport(student, record);
    }
    
    setTimeout(() => setScanMessage(null), 3000);
  };

  const handleManualAttendanceSubmit = () => {
    if (!selectedClass || !selectedSubject) {
      alert("Pilih Kelas dan Mata Pelajaran terlebih dahulu.");
      return;
    }

    const records: AttendanceRecord[] = belajarStudents.map(student => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: student.id,
      studentName: student.name,
      className: student.class,
      subject: selectedSubject,
      timestamp: new Date().toISOString(),
      status: manualStatuses[student.id] || 'PRESENT',
      scanType: 'MANUAL'
    }));

    const updatedAttendance = [...records, ...attendance];
    setAttendance(updatedAttendance);
    StorageService.saveAttendance(updatedAttendance);
    
    alert(`Absensi Kelas ${selectedClass} Berhasil Disimpan.`);
    setActiveView('DASHBOARD');
  };

  const generateCardCanvas = async (student: Student): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas error");
    canvas.width = 600; canvas.height = 380;
    
    // Background
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#4f46e5'); grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, 100);
    
    // Helper to load image
    const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

    // Draw School Logo
    if (schoolProfile.logo) {
      try {
        const logo = await loadImg(schoolProfile.logo);
        ctx.drawImage(logo, 30, 20, 60, 60);
      } catch(e) {}
    }

    // Draw District Logo
    if (schoolProfile.districtLogo) {
      try {
        const dLogo = await loadImg(schoolProfile.districtLogo);
        ctx.drawImage(dLogo, canvas.width - 90, 20, 60, 60);
      } catch(e) {}
    }

    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; 
    ctx.font = 'bold 24px Inter';
    ctx.fillText('KARTU PELAJAR', canvas.width / 2, 45);
    ctx.font = 'bold 12px Inter';
    ctx.fillText((schoolProfile.schoolName || 'SEKOLAH DIGITAL').toUpperCase(), canvas.width / 2, 70);

    ctx.textAlign = 'left';
    const draw = (l: string, v: string, i: number) => {
      const y = 140 + (i * 55);
      ctx.fillStyle = '#64748b'; ctx.font = 'bold 10px Inter'; ctx.fillText(l, 30, y);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Inter'; ctx.fillText(v.toUpperCase(), 30, y + 22);
    };
    draw('NAMA LENGKAP', student.name, 0);
    draw('KELAS', student.class, 1);
    draw('ID SISWA', student.id, 2);
    
    // Draw Student Photo (if exists) - Left of QR
    if (student.photo) {
      try {
        const photoImg = await loadImg(student.photo);
        const px = 275, py = 130, pw = 140, ph = 140, radius = 24;
        
        ctx.save();
        // Rounded rectangle clipping
        ctx.beginPath();
        ctx.moveTo(px + radius, py);
        ctx.arcTo(px + pw, py, px + pw, py + ph, radius);
        ctx.arcTo(px + pw, py + ph, px, py + ph, radius);
        ctx.arcTo(px, py + ph, px, py, radius);
        ctx.arcTo(px, py, px + pw, py, radius);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photoImg, px, py, pw, ph);
        ctx.restore();
        
        // Photo Frame Border
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        ctx.stroke();
      } catch (e) {}
    }

    // Draw QR Code
    try {
      const qrUrl = await QRCode.toDataURL(student.id, { margin: 1, width: 140 });
      const img = await loadImg(qrUrl);
      ctx.drawImage(img, 430, 130, 140, 140);
    } catch (e) {}

    // Footer
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(schoolProfile.address || 'Alamat Sekolah Digital', canvas.width / 2, canvas.height - 10);

    return canvas;
  };

  const downloadStudentCard = async (student: Student) => {
    const canvas = await generateCardCanvas(student);
    const link = document.createElement('a');
    link.download = `KARTU_${student.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-24 bg-slate-50 text-slate-900">
      <nav className="fixed bottom-0 left-0 w-full md:top-0 md:left-0 md:w-24 md:h-screen bg-white border-t md:border-t-0 md:border-r border-slate-200 flex md:flex-col items-center justify-around md:justify-center gap-6 p-4 z-50 shadow-xl md:shadow-none">
        {[
          { id: 'DASHBOARD', icon: HomeIcon, label: 'Home' },
          { id: 'ADMIN', icon: ShieldCheckIcon, label: 'Admin' },
          { id: 'SCANNER', icon: QrCodeIcon, label: 'Scan' },
          { id: 'BELAJAR', icon: AcademicCapIcon, label: 'Belajar' },
          { id: 'REPORTS', icon: DocumentTextIcon, label: 'Laporan' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveView(item.id as ViewState)} className={`flex flex-col items-center gap-1 transition-all ${activeView === item.id || (item.id === 'ADMIN' && isAdminView) ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}>
            <item.icon className="w-7 h-7" />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {isAdminView && activeView !== 'ADMIN' && (
              <button onClick={() => setActiveView('ADMIN')} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
              {activeView === 'DASHBOARD' && 'Dashboard'}
              {activeView === 'ADMIN' && 'Pengaturan'}
              {activeView === 'SCANNER' && 'Scanner QR'}
              {activeView === 'STUDENTS' && 'Database Siswa'}
              {activeView === 'TEACHERS' && 'Basis Data Guru'}
              {activeView === 'TENDIK' && 'Data Staff'}
              {activeView === 'REPORTS' && 'Rekap Laporan'}
              {activeView === 'SCHOOL_PROFILE' && 'Profil Sekolah'}
              {activeView === 'SYSTEM_SETTINGS' && 'Setting Aplikasi'}
              {activeView === 'BELAJAR' && 'Absensi Belajar'}
            </h1>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          
          {/* DASHBOARD */}
          {activeView === 'DASHBOARD' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Siswa', value: students.length, color: 'indigo', icon: UsersIcon },
                  { label: 'Hadir Hari Ini', value: attendance.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.scanType === 'HADIR').length, color: 'emerald', icon: CheckCircleIcon },
                  { label: 'Total Guru', value: teachers.length, color: 'sky', icon: UserGroupIcon },
                  { label: 'Scan Pulang', value: attendance.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.scanType === 'PULANG').length, color: 'amber', icon: ClockIcon },
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${colorStyles[stat.color].bg} ${colorStyles[stat.color].text}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-end mb-6">
                    <div><h3 className="text-lg font-black text-slate-800">Persentase Kehadiran</h3><p className="text-xs text-slate-500 font-medium">Monitoring harian real-time</p></div>
                    <p className="text-3xl font-black text-indigo-600">{students.length > 0 ? Math.round((attendance.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.scanType === 'HADIR').length / students.length) * 100) : 0}%</p>
                 </div>
                 <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${students.length > 0 ? (attendance.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString() && a.scanType === 'HADIR').length / students.length) * 100 : 0}%` }}></div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Log Terakhir</h3></div>
                    <div className="divide-y divide-slate-50">
                       {attendance.slice(0, 5).map(log => (
                         <div key={log.id} className="p-4 flex items-center justify-between">
                            <div><p className="text-sm font-bold text-slate-700 uppercase">{log.studentName}</p><p className="text-[9px] font-black text-slate-400 uppercase">{log.className} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                            <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase ${log.scanType === 'HADIR' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{log.scanType}</span>
                         </div>
                       ))}
                       {attendance.length === 0 && <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase italic">Belum ada aktivitas scan</div>}
                    </div>
                 </div>
                 <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <QrCodeIcon className="w-16 h-16 mb-4 opacity-50" />
                    <h3 className="text-2xl font-black mb-4 uppercase">Mode Scanner Aktif</h3>
                    <button onClick={() => setActiveView('SCANNER')} className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black uppercase text-sm hover:scale-105 transition-all shadow-xl">Buka Kamera</button>
                 </div>
              </div>
            </div>
          )}

          {/* ADMIN MENU */}
          {activeView === 'ADMIN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {[
                 { id: 'SCHOOL_PROFILE', icon: BuildingLibraryIcon, label: 'Profil Sekolah', desc: 'Identitas instansi & logo', color: 'indigo' },
                 { id: 'STUDENTS', icon: UsersIcon, label: 'Database Siswa', desc: `${students.length} Siswa terdaftar`, color: 'indigo' },
                 { id: 'TEACHERS', icon: UserGroupIcon, label: 'Database Guru', desc: `${teachers.length} Guru pengajar`, color: 'emerald' },
                 { id: 'TENDIK', icon: ShieldCheckIcon, label: 'Staff & Tendik', desc: `${admins.length} Staff kependidikan`, color: 'amber' },
                 { id: 'SYSTEM_SETTINGS', icon: Cog6ToothIcon, label: 'Pengaturan App', desc: 'WA & Pembersihan Data', color: 'slate' },
               ].map(item => (
                 <button key={item.id} onClick={() => setActiveView(item.id as ViewState)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 text-left group hover:border-indigo-200 transition-all">
                    <div className={`p-4 rounded-2xl ${colorStyles[item.color].bg} ${colorStyles[item.color].text} group-hover:scale-110 transition-transform`}><item.icon className="w-8 h-8" /></div>
                    <div className="flex-1"><span className="text-sm font-black uppercase text-slate-800 block mb-1">{item.label}</span><span className="text-xs text-slate-400 font-medium">{item.desc}</span></div>
                    <ChevronRightIcon className="w-5 h-5 text-slate-300" />
                 </button>
               ))}
            </div>
          )}

          {/* BELAJAR - ABSENSI MANUAL */}
          {activeView === 'BELAJAR' && (
            <div className="space-y-8 pb-24">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Pilih Kelas</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 appearance-none" 
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {availableSchoolClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Mata Pelajaran</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 appearance-none" 
                    value={selectedSubject} 
                    onChange={e => setSelectedSubject(e.target.value)}
                  >
                    <option value="">-- Pilih Mapel --</option>
                    {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daftar Siswa Kelas {selectedClass}</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black uppercase text-slate-400">H</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-[10px] font-black uppercase text-slate-400">S</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-sky-500"></div><span className="text-[10px] font-black uppercase text-slate-400">I</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[10px] font-black uppercase text-slate-400">A</span></div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {belajarStudents.map(student => (
                      <div key={student.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                             {student.photo ? (
                               <img src={student.photo} className="w-full h-full object-cover" alt={student.name} />
                             ) : (
                               <UserCircleIcon className="w-full h-full text-slate-300" />
                             )}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase text-sm mb-0.5">{student.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {student.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { key: 'PRESENT', label: 'H', color: 'indigo' },
                            { key: 'SAKIT', label: 'S', color: 'amber' },
                            { key: 'IJIN', label: 'I', color: 'sky' },
                            { key: 'ALPHA', label: 'A', color: 'red' }
                          ].map(status => (
                            <button
                              key={status.key}
                              onClick={() => setManualStatuses(prev => ({ ...prev, [student.id]: status.key as any }))}
                              className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                                (manualStatuses[student.id] || 'PRESENT') === status.key
                                  ? `${colorStyles[status.color].bg} ${colorStyles[status.color].text} scale-110 shadow-sm border ${colorStyles[status.color].border}`
                                  : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {belajarStudents.length === 0 && (
                      <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic text-xs">Pilih kelas untuk memuat data</div>
                    )}
                  </div>
                  {belajarStudents.length > 0 && (
                    <div className="p-8 bg-slate-50/30 border-t border-slate-100">
                      <button 
                        onClick={handleManualAttendanceSubmit}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                      >
                        <HandThumbUpIcon className="w-5 h-5" />
                        Simpan Absensi Kelas
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STUDENTS DATABASE */}
          {activeView === 'STUDENTS' && (
            <div className="space-y-8 pb-24">
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 w-full relative">
                    <MagnifyingGlassIcon className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Cari nama atau kelas..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">{editingStudentId ? 'Update Informasi Siswa' : 'Tambah Siswa Baru'}</h3>
                  <form onSubmit={handleSaveStudent} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Input Foto Siswa */}
                    <div className="md:col-span-3 flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <div className="w-24 h-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {newStudent.photo ? (
                          <img src={newStudent.photo} className="w-full h-full object-cover" alt="Preview Foto" />
                        ) : (
                          <UserCircleIcon className="w-12 h-12 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center md:text-left space-y-3">
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Pas Foto Siswa</p>
                            <p className="text-[10px] text-slate-400 font-medium">Foto ini akan otomatis tampil di kartu pelajar digital.</p>
                         </div>
                         <label className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                            <CameraIcon className="w-4 h-4" />
                            Unggah Foto
                            <input type="file" className="hidden" accept="image/*" onChange={handleStudentPhotoUpload} />
                         </label>
                      </div>
                    </div>

                    <input type="text" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Nama Lengkap" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
                    
                    {/* Input Kelas Dropdown berdasarkan Profile */}
                    <div className="relative">
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 appearance-none" 
                        value={newStudent.class} 
                        onChange={e => setNewStudent({...newStudent, class: e.target.value})} 
                        required
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {availableSchoolClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronRightIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90" />
                    </div>

                    <input type="tel" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="WA Ortu (628...)" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} required />
                    <button type="submit" className="md:col-span-3 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-indigo-700 transition-all">Simpan Database</button>
                  </form>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                             {student.photo ? (
                               <img src={student.photo} className="w-full h-full object-cover" alt={student.name} />
                             ) : (
                               <span className="font-black text-indigo-600 uppercase text-lg">{student.name.charAt(0)}</span>
                             )}
                          </div>
                          <div>
                             <p className="font-black text-slate-800 uppercase text-sm leading-none mb-1">{student.name}</p>
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{student.class} • ID: {student.id}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => downloadStudentCard(student)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Download PNG">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => {setEditingStudentId(student.id); setNewStudent({...student}); window.scrollTo({top: 0, behavior: 'smooth'});}} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => { if(confirm("Hapus data siswa ini?")) { const upd = students.filter(s => s.id !== student.id); setStudents(upd); StorageService.saveStudents(upd); } }} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && <div className="md:col-span-2 p-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Data tidak ditemukan</div>}
               </div>
            </div>
          )}

          {/* TEACHERS MANAGEMENT */}
          {activeView === 'TEACHERS' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
                   <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">{editingTeacherId ? 'Edit Data Guru' : 'Tambah Guru'}</h3>
                   <form onSubmit={handleSaveTeacher} className="space-y-4">
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Nama Guru" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} required />
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="NIP" value={newTeacher.nip} onChange={e => setNewTeacher({...newTeacher, nip: e.target.value})} />
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Mata Pelajaran" value={newTeacher.subject1} onChange={e => setNewTeacher({...newTeacher, subject1: e.target.value})} required />
                      <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-emerald-700 transition-all">Simpan Guru</button>
                   </form>
                </div>
                <div className="lg:col-span-2 space-y-4">
                   <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mb-4">
                      <input type="text" className="w-full p-2 bg-transparent outline-none font-bold" placeholder="Cari nama guru..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} />
                   </div>
                   {filteredTeachers.map(t => (
                     <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center font-black text-emerald-600 uppercase">{t.name.charAt(0)}</div>
                           <div><p className="font-black text-slate-800 uppercase text-sm leading-none mb-1">{t.name}</p><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.subject1} • NIP: {t.nip || '-'}</p></div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => {setEditingTeacherId(t.id); setNewTeacher({...t});}} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all"><PencilSquareIcon className="w-5 h-5" /></button>
                           <button onClick={() => { if(confirm("Hapus guru?")) { const upd = teachers.filter(x => x.id !== t.id); setTeachers(upd); StorageService.saveTeachers(upd); } }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* TENDIK (STAFF) */}
          {activeView === 'TENDIK' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
                  <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">{editingAdminId ? 'Edit Staff' : 'Tambah Staff'}</h3>
                  <form onSubmit={handleSaveAdmin} className="space-y-4">
                     <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Nama Staff" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} required />
                     <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="NIP" value={newAdmin.nip} onChange={e => setNewAdmin({...newAdmin, nip: e.target.value})} />
                     <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Jabatan" value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})} required />
                     <button type="submit" className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-amber-700 transition-all">Simpan Staff</button>
                  </form>
               </div>
               <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mb-4">
                      <input type="text" className="w-full p-2 bg-transparent outline-none font-bold" placeholder="Cari staff..." value={tendikSearch} onChange={e => setTendikSearch(e.target.value)} />
                   </div>
                  {filteredAdmins.map(a => (
                    <div key={a.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center font-black text-amber-600 uppercase">{a.name.charAt(0)}</div>
                          <div><p className="font-black text-slate-800 uppercase text-sm leading-none mb-1">{a.name}</p><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{a.role} • NIP: {a.nip || '-'}</p></div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => {setEditingAdminId(a.id); setNewAdmin({...a});}} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all"><PencilSquareIcon className="w-5 h-5" /></button>
                          <button onClick={() => { if(confirm("Hapus staff?")) { const upd = admins.filter(x => x.id !== a.id); setAdmins(upd); StorageService.saveAdmins(upd); } }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><TrashIcon className="w-5 h-5" /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* SCANNER INTERFACE */}
          {activeView === 'SCANNER' && (
            <div className="flex flex-col items-center space-y-6">
               <div className="w-full max-w-md grid grid-cols-2 gap-4 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                  <button onClick={() => setScanType('HADIR')} className={`py-4 rounded-[1.5rem] font-black text-xs tracking-widest transition-all ${scanType === 'HADIR' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-slate-50 text-slate-400'}`}>SCAN MASUK</button>
                  <button onClick={() => setScanType('PULANG')} className={`py-4 rounded-[1.5rem] font-black text-xs tracking-widest transition-all ${scanType === 'PULANG' ? 'bg-amber-600 text-white shadow-xl shadow-amber-100' : 'bg-slate-50 text-slate-400'}`}>SCAN PULANG</button>
               </div>
               <div className="relative w-full flex flex-col items-center">
                  <QRScanner onScan={handleQRScan} isScanning={true} />
                  {scanMessage && (
                    <div className={`absolute top-1/2 -translate-y-1/2 z-[60] px-10 py-8 rounded-[3rem] shadow-2xl border-4 backdrop-blur-md ${
                      scanMessage.type === 'success' ? 'bg-emerald-600/90 border-emerald-100 text-white' : 
                      scanMessage.type === 'error' ? 'bg-red-600/90 border-red-100 text-white' : 
                      scanMessage.type === 'sending' ? 'bg-indigo-600/90 border-indigo-100 text-white' :
                      'bg-sky-600/90 border-sky-100 text-white'
                    }`}>
                       <div className="flex flex-col items-center gap-3">
                          {scanMessage.type === 'info' && <InformationCircleIcon className="w-16 h-16" />}
                          {scanMessage.type === 'success' && <CheckCircleIcon className="w-16 h-16" />}
                          {scanMessage.type === 'sending' && <PaperAirplaneIcon className="w-16 h-16 animate-bounce" />}
                          {scanMessage.type === 'error' && <ExclamationTriangleIcon className="w-16 h-16" />}
                          <p className="text-xl font-black uppercase text-center leading-tight tracking-tight">{scanMessage.text}</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* REPORTS TABLE */}
          {activeView === 'REPORTS' && (
            <div className="space-y-6 pb-24">
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <FunnelIcon className="w-5 h-5 text-slate-400" />
                    <input type="date" className="font-black text-slate-700 outline-none p-2" value={reportFilterDate} onChange={e => setReportFilterDate(e.target.value)} />
                  </div>
               </div>
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {filteredAttendance.map(row => (
                    <div key={row.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                       <div>
                         <p className="font-black text-slate-800 uppercase text-sm leading-none mb-1">{row.studentName}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {row.className} • {row.subject && `${row.subject} • `} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase ${
                           row.status === 'SAKIT' ? 'bg-amber-100 text-amber-700' :
                           row.status === 'IJIN' ? 'bg-sky-100 text-sky-700' :
                           row.status === 'ALPHA' ? 'bg-red-100 text-red-700' :
                           'bg-emerald-100 text-emerald-700'
                         }`}>
                           {row.status === 'PRESENT' ? row.scanType : row.status}
                         </span>
                       </div>
                    </div>
                  ))}
                  {filteredAttendance.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs italic">Tidak ada aktivitas pada tanggal ini</div>}
               </div>
            </div>
          )}

          {/* SCHOOL PROFILE SETTINGS */}
          {activeView === 'SCHOOL_PROFILE' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-500 pb-24">
              <h2 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight flex items-center gap-2"><BuildingLibraryIcon className="w-6 h-6 text-indigo-500" /> Identitas Instansi</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo District Upload */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest block">Logo Kabupaten / Provinsi</label>
                       <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                             {schoolProfile.districtLogo ? (
                               <img src={schoolProfile.districtLogo} className="w-full h-full object-contain p-2" alt="Logo Kabupaten" />
                             ) : (
                               <PhotoIcon className="w-8 h-8 text-slate-300" />
                             )}
                          </div>
                          <div className="flex-1">
                             <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-all">
                               <CloudArrowUpIcon className="w-4 h-4" />
                               Unggah Logo
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'districtLogo')} />
                             </label>
                             <p className="mt-2 text-[9px] text-slate-400 font-medium">Format PNG/JPG (Maks 1MB)</p>
                          </div>
                       </div>
                    </div>

                    {/* Logo School Upload */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest block">Logo Sekolah</label>
                       <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                             {schoolProfile.logo ? (
                               <img src={schoolProfile.logo} className="w-full h-full object-contain p-2" alt="Logo Sekolah" />
                             ) : (
                               <PhotoIconSolid className="w-8 h-8 text-slate-300" />
                             )}
                          </div>
                          <div className="flex-1">
                             <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-all">
                               <CloudArrowUpIcon className="w-4 h-4" />
                               Unggah Logo
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                             </label>
                             <p className="mt-2 text-[9px] text-slate-400 font-medium">Format PNG/JPG (Maks 1MB)</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Sekolah</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500" value={schoolProfile.schoolName} onChange={e => setSchoolProfile({...schoolProfile, schoolName: e.target.value})} placeholder="Nama Sekolah" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Kepala Sekolah</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500" value={schoolProfile.headmasterName} onChange={e => setSchoolProfile({...schoolProfile, headmasterName: e.target.value})} placeholder="Nama & Gelar" /></div>
                    
                    {/* Dropdown Jumlah Ruang Kelas */}
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Jumlah Ruang Kelas</label>
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 appearance-none"
                        value={schoolProfile.roomCount}
                        onChange={e => setSchoolProfile({...schoolProfile, roomCount: e.target.value})}
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num.toString()}>{num} Ruangan</option>
                        ))}
                      </select>
                      <ChevronRightIcon className="w-5 h-5 text-slate-400 absolute right-4 bottom-5 rotate-90" />
                    </div>

                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Alamat Sekolah</label><textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold min-h-[100px] focus:ring-2 focus:ring-indigo-500" value={schoolProfile.address} onChange={e => setSchoolProfile({...schoolProfile, address: e.target.value})} placeholder="Alamat Lengkap Sekolah..." /></div>
                 </div>

                 {/* DYNAMIC ROOM CONFIGURATION */}
                 <div className="mt-12 pt-12 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Squares2X2Icon className="w-6 h-6" /></div>
                       <div>
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Konfigurasi Ruang & Rombel</h3>
                          <p className="text-xs text-slate-400 font-medium">Lengkapi tingkat kelas dan nama rombel untuk setiap ruangan.</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: parseInt(schoolProfile.roomCount) || 1 }, (_, i) => (
                        <div key={i} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 hover:border-indigo-200 transition-colors group">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <HashtagIcon className="w-4 h-4 text-indigo-400" />
                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Ruang {i + 1}</span>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-indigo-200 group-hover:scale-150 transition-transform"></div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkat Kelas</label>
                            <input 
                              type="text" 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                              placeholder="Contoh: 7 / X / VIII" 
                              value={schoolProfile.classes[i] || ''} 
                              onChange={(e) => handleClassChange(i, e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Rombel</label>
                            <input 
                              type="text" 
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                              placeholder="Contoh: A / IPA 1 / Unggulan" 
                              value={schoolProfile.rombels[i] || ''} 
                              onChange={(e) => handleRombelChange(i, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-12 border-t border-slate-50">
                    <button type="button" onClick={() => setActiveView('ADMIN')} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Batal</button>
                    <button type="submit" disabled={isSavingProfile} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all">{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</button>
                 </div>
              </form>
            </div>
          )}

          {/* SYSTEM SETTINGS */}
          {activeView === 'SYSTEM_SETTINGS' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-500">
               <h2 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight flex items-center gap-2"><Cog6ToothIcon className="w-6 h-6 text-slate-500" /> Pengaturan Sistem</h2>
               <div className="space-y-8">
                  <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                     <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2"><ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> Laporan WhatsApp</h4>
                     <textarea className="w-full p-4 bg-white border border-indigo-200 rounded-2xl outline-none font-mono text-xs leading-relaxed min-h-[150px]" value={schoolProfile.whatsappTemplate} onChange={e => setSchoolProfile({...schoolProfile, whatsappTemplate: e.target.value})} />
                     <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
                        {['{{nama}}', '{{kelas}}', '{{tipe}}', '{{waktu}}', '{{tanggal}}', '{{sekolah}}'].map(v => (
                           <div key={v} className="bg-white/60 p-2 rounded-lg text-center border border-indigo-100 text-[10px] font-black text-indigo-600 tracking-tighter">{v}</div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100">
                     <h4 className="text-sm font-black text-red-800 uppercase tracking-widest mb-2 flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" /> Zona Bahaya</h4>
                     <button onClick={() => { if(confirm("Hapus seluruh log absensi?")) { setAttendance([]); StorageService.saveAttendance([]); alert("Log berhasil dikosongkan."); } }} className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all">Kosongkan Log Absensi</button>
                  </div>

                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setActiveView('ADMIN')} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Kembali</button>
                     <button onClick={handleUpdateProfile} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Simpan Konfigurasi</button>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
