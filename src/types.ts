export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  parentName?: string;
  parentPhone?: string;
  course: string; // e.g., "YKS Hazırlık", "English Speaking", "Robotik Kodlama"
  registrationDate: string; // YYYY-MM-DD
  totalFee: number; // Toplam anlaşma ücreti
  downPayment: number; // Peşinat
  installmentCount: number; // Taksit sayısı
  notes?: string;
  status: 'active' | 'graduated' | 'frozen';
  teacherId?: string;
  teacherName?: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  branch: string; // Branş/Enstrüman örn: Piyano, Keman
  status: 'active' | 'inactive';
}

export interface Installment {
  id: string;
  studentId: string;
  studentName: string; // denormalized for search & table queries
  installmentNumber: number; // e.g., 1, 2, 3
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: 'Cash' | 'Credit Card' | 'Bank Transfer' | string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface CashTransaction {
  id: string;
  studentId?: string;
  studentName?: string;
  installmentId?: string;
  amount: number;
  type: 'incoming' | 'outgoing';
  category: string; // e.g., "Tahsilat", "Kayıt Ücreti", "Gider", "İade"
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  description: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  dayOfWeek: number; // 1 = Pazartesi, 2 = Salı, 3 = Çarşamba, 4 = Perşembe, 5 = Cuma, 6 = Cumartesi, 7 = Pazar
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  course: string;
  teacherName?: string;
  color?: string; // hex or tailwind bg class
}

