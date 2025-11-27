import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { ScheduleItem } from '../types';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAO9x8YDYqauALigdwn88sIH0mz4o1dkq8",
  authDomain: "quadro-de-horarios-cemal.firebaseapp.com",
  // A URL do Database é inferida do Project ID. Se não funcionar, verifique no console do Firebase > Realtime Database.
  databaseURL: "https://quadro-de-horarios-cemal-default-rtdb.firebaseio.com",
  projectId: "quadro-de-horarios-cemal",
  storageBucket: "quadro-de-horarios-cemal.firebasestorage.app",
  messagingSenderId: "938230155772",
  appId: "1:938230155772:web:233c1988be79c58ad7ca79",
  measurementId: "G-X4GRDELC5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- SERVICES ---

// 1. SCHEDULE (Grade Horária)

export const subscribeToSchedule = (callback: (data: ScheduleItem[]) => void) => {
  const scheduleRef = ref(db, 'school_schedule');
  return onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    // Se não houver dados (null), retorna array vazio
    callback(data || []);
  });
};

export const updateSchedule = async (newSchedule: ScheduleItem[]) => {
  const scheduleRef = ref(db, 'school_schedule');
  return set(scheduleRef, newSchedule);
};

// 2. REGISTRY (Cadastros de Disciplinas/Professores)

export interface RegistryItem {
    subject: string;
    teachers: string[];
}

export const subscribeToRegistry = (callback: (data: RegistryItem[]) => void) => {
  const registryRef = ref(db, 'school_registry_linked');
  return onValue(registryRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || []);
  });
};

export const updateRegistry = async (newRegistry: RegistryItem[]) => {
  const registryRef = ref(db, 'school_registry_linked');
  return set(registryRef, newRegistry);
};