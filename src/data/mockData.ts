import { Student, Installment, CashTransaction, Lesson, Teacher } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "std-1",
    name: "Ahmet Yılmaz",
    phone: "0532 111 2233",
    email: "ahmet.yilmaz@xyz.com",
    parentName: "Mehmet Yılmaz",
    parentPhone: "0532 111 2234",
    course: "Piyano",
    registrationDate: "2026-02-10",
    totalFee: 45000,
    downPayment: 9000,
    installmentCount: 6,
    status: "active",
    notes: "Hafta içi akşam grubu."
  },
  {
    id: "std-2",
    name: "Zeynep Kaya",
    phone: "0543 222 3344",
    email: "zeynep.kaya@gmail.com",
    parentName: "Ayşe Kaya",
    parentPhone: "0543 222 3345",
    course: "Keman",
    registrationDate: "2026-03-01",
    totalFee: 32000,
    downPayment: 5000,
    installmentCount: 5,
    status: "active",
    notes: "Burslu kayıt (%10 indirim uygulandı)."
  },
  {
    id: "std-3",
    name: "Emir Demir",
    phone: "0555 333 4455",
    email: "emir.demir@outlook.com",
    parentName: "Mustafa Demir",
    parentPhone: "0555 333 4456",
    course: "Gitar",
    registrationDate: "2026-04-15",
    totalFee: 18000,
    downPayment: 3000,
    installmentCount: 3,
    status: "active",
    notes: "Hafta sonu sabah grubu."
  },
  {
    id: "std-4",
    name: "Elif Şahin",
    phone: "0505 444 5566",
    email: "elif.sahin@live.com",
    parentName: "Fatma Şahin",
    parentPhone: "0505 444 5567",
    course: "Robotik Kodlama",
    registrationDate: "2026-05-02",
    totalFee: 15000,
    downPayment: 3000,
    installmentCount: 4,
    status: "active",
    notes: "Özel ilgi ve yetenek grubu öğrencisi."
  },
  {
    id: "std-5",
    name: "Can Boran",
    phone: "0531 999 8877",
    email: "can.boran@gmail.com",
    parentName: "Hakan Boran",
    parentPhone: "0531 999 8878",
    course: "Bateri",
    registrationDate: "2025-09-01",
    totalFee: 40000,
    downPayment: 8000,
    installmentCount: 8,
    status: "graduated",
    notes: "Mezun grup öğrencimiz."
  }
];

export const INITIAL_INSTALLMENTS: Installment[] = [
  // Ahmet Yılmaz (std-1) - Total: 45000, Down: 9000. Balance: 36000. 6 installments of 6000.
  // Reg: 2026-02-10. Overdue/Paid installments analysis relative to June 17, 2026.
  {
    id: "inst-1-1",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    installmentNumber: 1,
    dueDate: "2026-03-10",
    amount: 6000,
    paidAmount: 6000,
    paymentDate: "2026-03-09",
    paymentMethod: "Bank Transfer",
    status: "paid"
  },
  {
    id: "inst-1-2",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    installmentNumber: 2,
    dueDate: "2026-04-10",
    amount: 6000,
    paidAmount: 6000,
    paymentDate: "2026-04-10",
    paymentMethod: "Bank Transfer",
    status: "paid"
  },
  {
    id: "inst-1-3",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    installmentNumber: 3,
    dueDate: "2026-05-10",
    amount: 6000,
    paidAmount: 6000,
    paymentDate: "2026-05-12",
    paymentMethod: "Credit Card",
    status: "paid"
  },
  {
    id: "inst-1-4",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    installmentNumber: 4,
    dueDate: "2026-06-10",
    amount: 6000,
    paidAmount: 0, // Delayed/Overdue since June 17, 2026 is current time
    status: "overdue"
  },
  {
    id: "inst-1-5",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    installmentNumber: 5,
    dueDate: "2026-07-10",
    amount: 6000,
    paidAmount: 0,
    status: "pending"
  },
  {
    id: "inst-1-6",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    installmentNumber: 6,
    dueDate: "2026-08-10",
    amount: 6000,
    paidAmount: 0,
    status: "pending"
  },

  // Zeynep Kaya (std-2) - Total: 32000, Down: 5000. Balance: 27000. 5 installments of 5400.
  // Reg: 2026-03-01. Due dates on 1st of each month.
  {
    id: "inst-2-1",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    installmentNumber: 1,
    dueDate: "2026-04-01",
    amount: 5400,
    paidAmount: 5400,
    paymentDate: "2026-04-01",
    paymentMethod: "Cash",
    status: "paid"
  },
  {
    id: "inst-2-2",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    installmentNumber: 2,
    dueDate: "2026-05-01",
    amount: 5400,
    paidAmount: 5400,
    paymentDate: "2026-05-01",
    paymentMethod: "Cash",
    status: "paid"
  },
  {
    id: "inst-2-3",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    installmentNumber: 3,
    dueDate: "2026-06-01",
    amount: 5400,
    paidAmount: 2000, // Partially paid, so still overdue for remainder
    status: "overdue"
  },
  {
    id: "inst-2-4",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    installmentNumber: 4,
    dueDate: "2026-07-01",
    amount: 5400,
    paidAmount: 0,
    status: "pending"
  },
  {
    id: "inst-2-5",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    installmentNumber: 5,
    dueDate: "2026-08-01",
    amount: 5400,
    paidAmount: 0,
    status: "pending"
  },

  // Emir Demir (std-3) - Total: 18000, Down: 3000. Balance: 15000. 3 installments of 5000.
  // Reg: 2026-04-15.
  {
    id: "inst-3-1",
    studentId: "std-3",
    studentName: "Emir Demir",
    installmentNumber: 1,
    dueDate: "2026-05-15",
    amount: 5000,
    paidAmount: 5000,
    paymentDate: "2026-05-14",
    paymentMethod: "Bank Transfer",
    status: "paid"
  },
  {
    id: "inst-3-2",
    studentId: "std-3",
    studentName: "Emir Demir",
    installmentNumber: 2,
    dueDate: "2026-06-15",
    amount: 5000,
    paidAmount: 0, // Unpaid, and due date has passed (June 15, current is June 17, 2026) => Overdue
    status: "overdue"
  },
  {
    id: "inst-3-3",
    studentId: "std-3",
    studentName: "Emir Demir",
    installmentNumber: 3,
    dueDate: "2026-07-15",
    amount: 5000,
    paidAmount: 0,
    status: "pending"
  },

  // Elif Şahin (std-4) - Total: 15000, Down: 3000. Balance: 12000. 4 installments of 3000.
  // Reg: 2026-05-02.
  {
    id: "inst-4-1",
    studentId: "std-4",
    studentName: "Elif Şahin",
    installmentNumber: 1,
    dueDate: "2026-06-02",
    amount: 3000,
    paidAmount: 3000,
    paymentDate: "2026-06-01",
    paymentMethod: "Credit Card",
    status: "paid"
  },
  {
    id: "inst-4-2",
    studentId: "std-4",
    studentName: "Elif Şahin",
    installmentNumber: 2,
    dueDate: "2026-07-02",
    amount: 3000,
    paidAmount: 0,
    status: "pending"
  },
  {
    id: "inst-4-3",
    studentId: "std-4",
    studentName: "Elif Şahin",
    installmentNumber: 3,
    dueDate: "2026-08-02",
    amount: 3000,
    paidAmount: 0,
    status: "pending"
  },
  {
    id: "inst-4-4",
    studentId: "std-4",
    studentName: "Elif Şahin",
    installmentNumber: 4,
    dueDate: "2026-09-02",
    amount: 3000,
    paidAmount: 0,
    status: "pending"
  },

  // Can Boran (std-5) - Graduated, completely paid. Balance: 0. Down: 8000, 8 installments of 4000
  {
    id: "inst-5-1", studentId: "std-5", studentName: "Can Boran", installmentNumber: 1, dueDate: "2025-10-01", amount: 4000, paidAmount: 4000, paymentDate: "2025-09-30", paymentMethod: "Cash", status: "paid"
  },
  {
    id: "inst-5-2", studentId: "std-5", studentName: "Can Boran", installmentNumber: 2, dueDate: "2025-11-01", amount: 4000, paidAmount: 4000, paymentDate: "2025-11-01", paymentMethod: "Cash", status: "paid"
  },
  {
    id: "inst-5-3", studentId: "std-5", studentName: "Can Boran", installmentNumber: 3, dueDate: "2025-12-01", amount: 4000, paidAmount: 4000, paymentDate: "2025-12-01", paymentMethod: "Bank Transfer", status: "paid"
  },
  {
    id: "inst-5-4", studentId: "std-5", studentName: "Can Boran", installmentNumber: 4, dueDate: "2026-01-01", amount: 4000, paidAmount: 4000, paymentDate: "2025-12-28", paymentMethod: "Credit Card", status: "paid"
  },
  {
    id: "inst-5-5", studentId: "std-5", studentName: "Can Boran", installmentNumber: 5, dueDate: "2026-02-01", amount: 4000, paidAmount: 4000, paymentDate: "2026-02-01", paymentMethod: "Bank Transfer", status: "paid"
  },
  {
    id: "inst-5-6", studentId: "std-5", studentName: "Can Boran", installmentNumber: 6, dueDate: "2026-03-01", amount: 4000, paidAmount: 4000, paymentDate: "2026-03-01", paymentMethod: "Bank Transfer", status: "paid"
  },
  {
    id: "inst-5-7", studentId: "std-5", studentName: "Can Boran", installmentNumber: 7, dueDate: "2026-04-01", amount: 4000, paidAmount: 4000, paymentDate: "2026-03-29", paymentMethod: "Cash", status: "paid"
  },
  {
    id: "inst-5-8", studentId: "std-5", studentName: "Can Boran", installmentNumber: 8, dueDate: "2026-05-01", amount: 4000, paidAmount: 4000, paymentDate: "2026-04-30", paymentMethod: "Bank Transfer", status: "paid"
  }
];

export const INITIAL_TRANSACTIONS: CashTransaction[] = [
  ...INITIAL_STUDENTS.map(s => ({
    id: `tx-down-${s.id}`,
    studentId: s.id,
    studentName: s.name,
    amount: s.downPayment,
    type: "incoming" as const,
    category: "Peşinat",
    date: s.registrationDate,
    paymentMethod: s.id === "std-2" ? "Cash" : "Bank Transfer",
    description: `Kayıt Peşinatı - ${s.name} (${s.course})`
  })),
  ...INITIAL_INSTALLMENTS.filter(inst => inst.status === "paid" || inst.paidAmount > 0).map(inst => ({
    id: `tx-inst-${inst.id}`,
    studentId: inst.studentId,
    studentName: inst.studentName,
    installmentId: inst.id,
    amount: inst.paidAmount,
    type: "incoming" as const,
    category: "Taksit Tahsilatı",
    date: inst.paymentDate || inst.dueDate,
    paymentMethod: inst.paymentMethod || "Bank Transfer",
    description: `${inst.studentName} - ${inst.installmentNumber}. Taksit Ödemesi`
  })),
  {
    id: "tx-exp-1",
    amount: 15000,
    type: "outgoing" as const,
    category: "Kira",
    date: "2026-06-01",
    paymentMethod: "Bank Transfer",
    description: "Haziran Ayı Sanat Atölyesi Kira Ödemesi"
  },
  {
    id: "tx-exp-2",
    amount: 4200,
    type: "outgoing" as const,
    category: "Fatura",
    date: "2026-06-05",
    paymentMethod: "Bank Transfer",
    description: "Mayıs Dönemi Elektrik ve Su Faturaları"
  },
  {
    id: "tx-exp-3",
    amount: 8500,
    type: "outgoing" as const,
    category: "Eğitmen Maaşı",
    date: "2026-06-15",
    paymentMethod: "Bank Transfer",
    description: "Mert Yılmaz - Kısmi Zamanlı Eğitmen Maaşı"
  }
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "les-1",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    dayOfWeek: 1, // Pazartesi
    startTime: "14:00",
    endTime: "15:00",
    course: "Piyano",
    teacherName: "Yağmur Yüksel",
    color: "indigo"
  },
  {
    id: "les-2",
    studentId: "std-1",
    studentName: "Ahmet Yılmaz",
    dayOfWeek: 3, // Çarşamba
    startTime: "16:00",
    endTime: "17:00",
    course: "Piyano",
    teacherName: "Yağmur Yüksel",
    color: "indigo"
  },
  {
    id: "les-3",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    dayOfWeek: 2, // Salı
    startTime: "15:30",
    endTime: "16:30",
    course: "Keman",
    teacherName: "Mert Yılmaz",
    color: "emerald"
  },
  {
    id: "les-4",
    studentId: "std-2",
    studentName: "Zeynep Kaya",
    dayOfWeek: 4, // Perşembe
    startTime: "15:30",
    endTime: "16:30",
    course: "Keman",
    teacherName: "Mert Yılmaz",
    color: "emerald"
  },
  {
    id: "les-5",
    studentId: "std-3",
    studentName: "Emir Demir",
    dayOfWeek: 5, // Cuma
    startTime: "10:00",
    endTime: "11:30",
    course: "Gitar",
    teacherName: "Selin Aksoy",
    color: "pink"
  },
  {
    id: "les-6",
    studentId: "std-4",
    studentName: "Elif Şahin",
    dayOfWeek: 6, // Cumartesi
    startTime: "11:00",
    endTime: "12:30",
    course: "Robotik Kodlama",
    teacherName: "Caner Bilgin",
    color: "purple"
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: "tch-1", name: "Yağmur Yüksel", phone: "0532 222 3344", email: "yagmur@yukselart.com", branch: "Piyano & Sanat", status: "active" },
  { id: "tch-2", name: "Murat Can", phone: "0555 444 5566", email: "murat.can@kademimuzik.com", branch: "Keman", status: "active" },
  { id: "tch-3", name: "Selin Şen", phone: "0533 111 2233", email: "selin.sen@gmail.com", branch: "Yan Flüt & Şan", status: "active" },
  { id: "tch-4", name: "Alican Türk", phone: "0542 333 4455", email: "alican.turk@hotmail.com", branch: "Gitar", status: "active" }
];

export function getStoredData() {
  const students = localStorage.getItem("or_students");
  const installments = localStorage.getItem("or_installments");
  const transactions = localStorage.getItem("or_transactions");
  const lessons = localStorage.getItem("or_lessons");
  const teachers = localStorage.getItem("or_teachers");

  if (students && installments && transactions) {
    try {
      const parsedStudents = JSON.parse(students) as Student[];
      const parsedInstallments = JSON.parse(installments) as Installment[];
      const parsedTransactions = JSON.parse(transactions) as CashTransaction[];
      const parsedLessons = lessons ? (JSON.parse(lessons) as Lesson[]) : INITIAL_LESSONS;
      const parsedTeachers = teachers ? (JSON.parse(teachers) as Teacher[]) : INITIAL_TEACHERS;

      return {
        students: parsedStudents,
        installments: parsedInstallments,
        transactions: parsedTransactions,
        lessons: parsedLessons,
        teachers: parsedTeachers
      };
    } catch (e) {
      console.error("Local storage load failed, falling back to initial values", e);
    }
  }

  return {
    students: INITIAL_STUDENTS,
    installments: INITIAL_INSTALLMENTS,
    transactions: INITIAL_TRANSACTIONS,
    lessons: INITIAL_LESSONS,
    teachers: INITIAL_TEACHERS
  };
}

export function saveStoredData(
  students: Student[],
  installments: Installment[],
  transactions: CashTransaction[],
  lessons?: Lesson[],
  teachers?: Teacher[]
) {
  localStorage.setItem("or_students", JSON.stringify(students));
  localStorage.setItem("or_installments", JSON.stringify(installments));
  localStorage.setItem("or_transactions", JSON.stringify(transactions));
  if (lessons) {
    localStorage.setItem("or_lessons", JSON.stringify(lessons));
  }
  if (teachers) {
    localStorage.setItem("or_teachers", JSON.stringify(teachers));
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTurkishDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function recalculateInstallmentStatus(installments: Installment[], currentDateStr?: string): Installment[] {
  const actualDateStr = currentDateStr || getTodayDateString();
  return installments.map(inst => {
    if (inst.status === "paid" && inst.paidAmount >= inst.amount) {
      return inst;
    }
    const isOverdue = inst.dueDate < actualDateStr && inst.paidAmount < inst.amount;
    return {
      ...inst,
      status: inst.paidAmount >= inst.amount ? "paid" : isOverdue ? "overdue" : "pending"
    };
  });
}
