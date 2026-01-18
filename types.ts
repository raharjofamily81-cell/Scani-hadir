
export interface Student {
  id: string;
  name: string;
  class: string;
  parentName: string;
  parentPhone: string;
  photo?: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  subject1: string;
  subject2: string;
  subject3: string;
  extraDuty: string;
}

export interface AdminMember {
  id: string;
  name: string;
  nip: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subject?: string;
  timestamp: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'SAKIT' | 'IJIN' | 'ALPHA';
  scanType: 'HADIR' | 'PULANG' | 'MANUAL';
}

export interface SchoolProfile {
  schoolName: string;
  address: string;
  headmasterName: string;
  teacherName: string;
  subject: string;
  logo?: string;
  districtLogo?: string;
  smpSubjects: string[];
  classes: string[];
  rombels: string[];
  rooms: string[];
  roomCount: string;
  whatsappTemplate: string;
}

export type ViewState = 'DASHBOARD' | 'ADMIN' | 'SCANNER' | 'STUDENTS' | 'REPORTS' | 'TENDIK' | 'TEACHERS' | 'SCHOOL_PROFILE' | 'SYSTEM_SETTINGS' | 'BELAJAR';
