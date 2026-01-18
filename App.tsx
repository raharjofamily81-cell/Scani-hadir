import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Student, AttendanceRecord, SchoolProfile, AppUser } from './types';
import { StorageService } from './storage';
import { WhatsAppService } from './whatsappService';
import QRScanner from './QRScanner';
import { 
  HomeIcon, QrCodeIcon, UsersIcon, DocumentTextIcon, 
  Cog6ToothIcon, TrashIcon, ShieldCheckIcon, BuildingLibraryIcon,
  XMarkIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, CameraIcon, 
  IdentificationIcon, CloudArrowUpIcon, ChatBubbleLeftRightIcon,
  GlobeAltIcon, KeyIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(StorageService.getSchoolProfile());
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'info' | 'error' | 'sending' } | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({ name: '', class: '', parentName: '', parentPhone: '', photo: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanType, setScanType] = useState<'HADIR' | 'PULANG'>('HADIR');

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const profile = StorageService.getSchoolProfile();
      setSchoolProfile(profile);
      const [s, a] = await Promise.all([
        StorageService.getStudents(profile),
        StorageService.getAttendance(profile)
      ]);
      setStudents(s);
      setAttendance(a);
      setIsLoading(false);
    };
    init();
  }, []);

  const triggerNotification = (text: string, type: 'success' | 'info' | 'error' | 'sending' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId.toLowerCase() === 'admin' && loginPin === '123456') {
      setCurrentUser({ id: 'admin', name: 'Administrator', role: 'ADMIN' });
      return;
    }
    const matched = students.find(s => s.id === loginId.toUpperCase());
    if (matched && loginPin === matched.parentPhone.slice(-4)) {
      setCurrentUser({ id: matched.id, name: matched.parentName, role: 'PARENT', studentId: matched.id });
      setActiveView('PARENT_REPORT');
      return;
    }
    triggerNotification("Login Gagal", "error");
  };

  const handleQRScan = async (studentId: string) => {
    if (statusMessage) return;
    const student = students.find(s => s.id === studentId);
    if (!student) {
      triggerNotification("ID Tidak Dikenal", "error");
      return;
    }
    const record: AttendanceRecord = { 
      id: Date.now().toString(), studentId: student.id, studentName: student.name, 
      className: student.class, timestamp: new Date().toISOString(), status: 'PRESENT', scanType 
    };
    await StorageService.addAttendance(record, schoolProfile);
    setAttendance(prev => [record, ...prev]);
    triggerNotification(`Berhasil: ${student.name}`);
    await WhatsAppService.sendAttendanceReport(student, record);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold uppercase tracking-widest text-slate-400">Memuat...</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 text-center">
        <div className="bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl">
          <ShieldCheckIcon className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-800 uppercase mb-8 tracking-tighter">Login ScanHadir</h1>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input type="text" placeholder="ID (Admin / ID Siswa)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold uppercase" value={loginId} onChange={e => setLoginId(e.target.value)} required />
            <input type="password" placeholder="PIN (Default: 123456)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={loginPin} onChange={e => setLoginPin(e.target.value)} required />
            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest">Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-24">
      {statusMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-full bg-slate-800 text-white font-black text-[10px] tracking-widest shadow-2xl">
          {statusMessage.text}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full md:top-0 md:left-0 md:w-24 md:h-screen bg-white border-t md:border-r flex md:flex-col items-center justify-around md:justify-center gap-8 p-4 z-50">
        <button onClick={() => setActiveView('DASHBOARD')} className={`p-2 ${activeView === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'}`}><HomeIcon className="w-6 h-6" /></button>
        <button onClick={() => setActiveView('SCANNER')} className={`p-2 ${activeView === 'SCANNER' ? 'text-indigo-600' : 'text-slate-400'}`}><QrCodeIcon className="w-6 h-6" /></button>
        <button onClick={() => setActiveView('STUDENTS')} className={`p-2 ${activeView === 'STUDENTS' ? 'text-indigo-600' : 'text-slate-400'}`}><UsersIcon className="w-6 h-6" /></button>
        <button onClick={() => setCurrentUser(null)} className="p-2 text-red-400"><ArrowLeftOnRectangleIcon className="w-6 h-6" /></button>
      </nav>

      <main className="p-6 md:p-12 max-w-5xl mx-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">{activeView}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{schoolProfile.schoolName}</p>
        </header>

        {activeView === 'DASHBOARD' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
              <p className="text-4xl font-black text-indigo-600">{students.length}</p>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Siswa Terdaftar</p>
            </div>
            <button onClick={() => setActiveView('SCANNER')} className="bg-indigo-600 p-8 rounded-[2.5rem] text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Buka Scanner</button>
          </div>
        )}

        {activeView === 'SCANNER' && (
          <div className="space-y-6">
            <div className="flex bg-white p-2 rounded-2xl border max-w-sm mx-auto">
              <button onClick={() => setScanType('HADIR')} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${scanType === 'HADIR' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>HADIR</button>
              <button onClick={() => setScanType('PULANG')} className={`flex-1 py-3 rounded-xl font-black text-[10px] ${scanType === 'PULANG' ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>PULANG</button>
            </div>
            <QRScanner onScan={handleQRScan} isScanning={true} />
          </div>
        )}

        {activeView === 'STUDENTS' && (
          <div className="space-y-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const s = { ...newStudent, id: 'ST' + Math.random().toString(36).substr(2, 6).toUpperCase() };
              const up = [...students, s];
              setStudents(up);
              await StorageService.saveStudents(up, schoolProfile);
              setNewStudent({ name: '', class: '', parentName: '', parentPhone: '', photo: '' });
              triggerNotification("Siswa Berhasil Ditambah");
            }} className="bg-white p-6 rounded-[2rem] border shadow-sm grid gap-4">
              <input type="text" placeholder="Nama Siswa" className="p-4 bg-slate-50 border rounded-xl font-bold" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
              <input type="text" placeholder="Kelas" className="p-4 bg-slate-50 border rounded-xl font-bold" value={newStudent.class} onChange={e => setNewStudent({...newStudent, class: e.target.value})} required />
              <input type="tel" placeholder="WA Ortu (628...)" className="p-4 bg-slate-50 border rounded-xl font-bold" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} required />
              <button className="py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest">Tambah Siswa</button>
            </form>
            <div className="grid gap-3">
              {students.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm uppercase">{s.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{s.class} | ID: {s.id}</p>
                  </div>
                  <button onClick={async () => {
                    if(confirm("Hapus?")) {
                      const up = students.filter(st => st.id !== s.id);
                      setStudents(up);
                      await StorageService.saveStudents(up, schoolProfile);
                    }
                  }} className="text-red-400 p-2"><TrashIcon className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
