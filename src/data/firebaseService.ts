import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { db } from "./firebase";
import { Student, Teacher, Installment, CashTransaction, Lesson } from "../types";
import { 
  INITIAL_STUDENTS, 
  INITIAL_INSTALLMENTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LESSONS, 
  INITIAL_TEACHERS 
} from "./mockData";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to remove 'undefined' properties from objects before saving to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => {
    if (value === undefined) {
      return null;
    }
    return value;
  }));
}

export interface AppDatabaseState {
  students: Student[];
  installments: Installment[];
  transactions: CashTransaction[];
  lessons: Lesson[];
  teachers: Teacher[];
}

/**
 * Loads all data from Firestore.
 * If Firestore has no student data, it automatically seeds it with initial default data.
 */
export async function loadFirestoreData(): Promise<AppDatabaseState> {
  let studentsSnap;
  try {
    studentsSnap = await getDocs(collection(db, "students"));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "students");
    throw error;
  }
  
  // If the database has no student records, we assume it's unseeded. Let's perform initial seeding.
  if (studentsSnap.empty) {
    console.log("Firestore empty. Seeding initial data...");
    await seedFirestoreData();
    return {
      students: INITIAL_STUDENTS,
      installments: INITIAL_INSTALLMENTS,
      transactions: INITIAL_TRANSACTIONS,
      lessons: INITIAL_LESSONS,
      teachers: INITIAL_TEACHERS
    };
  }

  // Retrieve Students
  const students: Student[] = [];
  studentsSnap.forEach(docSnap => {
    students.push({ id: docSnap.id, ...docSnap.data() } as Student);
  });

  // Retrieve Teachers
  const teachers: Teacher[] = [];
  try {
    const teachersSnap = await getDocs(collection(db, "teachers"));
    teachersSnap.forEach(docSnap => {
      teachers.push({ id: docSnap.id, ...docSnap.data() } as Teacher);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "teachers");
  }

  // Retrieve Installments
  const installments: Installment[] = [];
  try {
    const installmentsSnap = await getDocs(collection(db, "installments"));
    installmentsSnap.forEach(docSnap => {
      installments.push({ id: docSnap.id, ...docSnap.data() } as Installment);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "installments");
  }

  // Retrieve Transactions
  const transactions: CashTransaction[] = [];
  try {
    const transactionsSnap = await getDocs(collection(db, "transactions"));
    transactionsSnap.forEach(docSnap => {
      transactions.push({ id: docSnap.id, ...docSnap.data() } as CashTransaction);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "transactions");
  }

  // Retrieve Lessons
  const lessons: Lesson[] = [];
  try {
    const lessonsSnap = await getDocs(collection(db, "lessons"));
    lessonsSnap.forEach(docSnap => {
      lessons.push({ id: docSnap.id, ...docSnap.data() } as Lesson);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "lessons");
  }

  return {
    students,
    teachers,
    installments,
    transactions,
    lessons
  };
}

/**
 * Seeds initial mock data to Firestore collections in batches
 */
async function seedFirestoreData() {
  try {
    // 1. Seed Students
    for (const student of INITIAL_STUDENTS) {
      try {
        await setDoc(doc(db, "students", student.id), sanitizeForFirestore(student));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `students/${student.id}`);
      }
    }

    // 2. Seed Teachers
    for (const teacher of INITIAL_TEACHERS) {
      const branchCleaned = teacher.branch.replace("Tiyatro Kursu", "Piyano").replace("Tiyatro", "Piyano");
      const cleanedTeacher = { ...teacher, branch: branchCleaned };
      try {
        await setDoc(doc(db, "teachers", teacher.id), sanitizeForFirestore(cleanedTeacher));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `teachers/${teacher.id}`);
      }
    }

    // 3. Seed Installments
    for (const inst of INITIAL_INSTALLMENTS) {
      try {
        await setDoc(doc(db, "installments", inst.id), sanitizeForFirestore(inst));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `installments/${inst.id}`);
      }
    }

    // 4. Seed Transactions
    for (const tx of INITIAL_TRANSACTIONS) {
      try {
        await setDoc(doc(db, "transactions", tx.id), sanitizeForFirestore(tx));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `transactions/${tx.id}`);
      }
    }

    // 5. Seed Lessons
    for (const les of INITIAL_LESSONS) {
      try {
        await setDoc(doc(db, "lessons", les.id), sanitizeForFirestore(les));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `lessons/${les.id}`);
      }
    }

    console.log("Firebase seeding completed successfully!");
  } catch (error) {
    console.error("Firebase seeding failed:", error);
  }
}

/**
 * Synchronizes the changes between the old local database state and the new local database state.
 * Performs individual targeted setDoc and deleteDoc operations depending on the diff.
 */
export async function syncStateWithFirestore(
  oldState: AppDatabaseState,
  newState: AppDatabaseState
) {
  try {
    const batch = writeBatch(db);
    let batchSize = 0;
    const MAX_BATCH_SIZE = 400; // Firestore batch size limit is 500

    const executeBatchIfNeeded = async () => {
      if (batchSize >= MAX_BATCH_SIZE) {
        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, "batch_commit");
        }
        console.log(`Committed writing batch of ${batchSize} changes.`);
        batchSize = 0;
      }
    };

    // Helper closure to set/delete
    const diffCollection = async <T extends { id: string }>(
      colName: string,
      oldList: T[],
      newList: T[]
    ) => {
      const newKeys = new Set(newList.map(item => item.id));

      for (const item of oldList) {
        if (!newKeys.has(item.id)) {
          const docRef = doc(db, colName, item.id);
          batch.delete(docRef);
          batchSize++;
          await executeBatchIfNeeded();
        }
      }

      for (const item of newList) {
        const oldItem = oldList.find(o => o.id === item.id);
        const isNew = !oldItem;
        const isChanged = oldItem && JSON.stringify(oldItem) !== JSON.stringify(item);

        if (isNew || isChanged) {
          const docRef = doc(db, colName, item.id);
          batch.set(docRef, sanitizeForFirestore(item));
          batchSize++;
          await executeBatchIfNeeded();
        }
      }
    };

    // Run diff on all collections
    await diffCollection("students", oldState.students, newState.students);
    await diffCollection("teachers", oldState.teachers, newState.teachers);
    await diffCollection("installments", oldState.installments, newState.installments);
    await diffCollection("transactions", oldState.transactions, newState.transactions);
    await diffCollection("lessons", oldState.lessons, newState.lessons);

    // Commit remainder of batch
    if (batchSize > 0) {
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "batch_commit_final");
      }
      console.log(`Committed remainder batch of ${batchSize} changes.`);
    }
  } catch (error) {
    console.error("Error during diff-syncing with Firestore:", error);
    throw error;
  }
}

/**
 * Forcefully uploads local state data to Firestore, overwriting any remote collections with the local data.
 * This is extremely useful for migrating offline work to the live Cloud Database.
 */
export async function forceUploadLocalDataToFirestore(state: AppDatabaseState) {
  try {
    console.log("Starting forced migration of local data to Firestore...");
    
    // 1. Upload Students
    for (const student of state.students) {
      await setDoc(doc(db, "students", student.id), sanitizeForFirestore(student));
    }
    // 2. Upload Teachers
    for (const teacher of state.teachers) {
      await setDoc(doc(db, "teachers", teacher.id), sanitizeForFirestore(teacher));
    }
    // 3. Upload Installments
    for (const inst of state.installments) {
      await setDoc(doc(db, "installments", inst.id), sanitizeForFirestore(inst));
    }
    // 4. Upload Transactions
    for (const tx of state.transactions) {
      await setDoc(doc(db, "transactions", tx.id), sanitizeForFirestore(tx));
    }
    // 5. Upload Lessons
    for (const les of state.lessons) {
      await setDoc(doc(db, "lessons", les.id), sanitizeForFirestore(les));
    }
    console.log("Forced migration to Firestore completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}


