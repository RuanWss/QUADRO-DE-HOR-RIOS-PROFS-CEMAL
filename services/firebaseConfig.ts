import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { ScheduleItem } from '../types';

// CREDENCIAIS
const firebaseConfig = {
  apiKey: "AIzaSyAO9x8YDYqauALigdwn88sIH0mz4o1dkq8",
  authDomain: "quadro-de-horarios-cemal.firebaseapp.com",
  databaseURL: "https://quadro-de-horarios-cemal-default-rtdb.firebaseio.com",
  projectId: "quadro-de-horarios-cemal",
  storageBucket: "quadro-de-horarios-cemal.firebasestorage.app",
  messagingSenderId: "938230155772",
  appId: "1:938230155772:web:43939687fd5d6f59d7ca79",
  measurementId: "G-MWK9PMPBH8"
};

// Variáveis globais para armazenar a instância
let app;
let db;

try {
    console.log("Iniciando conexão com Firebase...");
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase conectado com sucesso! URL:", firebaseConfig.databaseURL);
} catch (e) {
    console.error("ERRO GRAVE AO CONECTAR FIREBASE:", e);
}

// --- FUNÇÃO DE AUXÍLIO PARA REINICIALIZAÇÃO MANUAL ---
export const initFirebaseManually = (customUrl: string) => {
    try {
        const config = { ...firebaseConfig, databaseURL: customUrl };
        const newApp = initializeApp(config, 'manual-' + Date.now()); 
        db = getDatabase(newApp);
        console.log("Reconectado manualmente na URL:", customUrl);
        return true;
    } catch (e) {
        console.error("Falha ao reconectar:", e);
        return false;
    }
};

// --- SERVIÇOS DE DADOS (HORÁRIOS) ---

export const subscribeToSchedule = (callback: (data: ScheduleItem[]) => void) => {
  if (!db) return () => {};
  
  const scheduleRef = ref(db, 'school_schedule');
  
  return onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || []);
  }, (error) => {
    console.error("ERRO DE PERMISSÃO FIREBASE:", error);
    window.dispatchEvent(new CustomEvent('firebase-error', { detail: error.message }));
  });
};

export const updateSchedule = async (newSchedule: ScheduleItem[]) => {
  if (!db) return;
  const scheduleRef = ref(db, 'school_schedule');
  try {
    await set(scheduleRef, newSchedule);
  } catch (error: any) {
    console.error("Erro ao salvar horário:", error);
    alert("ERRO AO SALVAR: Verifique se as Regras do Firebase permitem escrita.");
  }
};

// --- SERVIÇOS DE DADOS (CADASTROS/REGISTRY) ---

export interface RegistryItem {
    subject: string;
    teachers: string[];
}

export const subscribeToRegistry = (callback: (data: RegistryItem[]) => void) => {
  if (!db) return () => {};
  
  const registryRef = ref(db, 'school_registry_linked');
  
  return onValue(registryRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || []);
  }, (error) => {
    console.error("Erro ao ler cadastros:", error);
  });
};

export const updateRegistry = async (newRegistry: RegistryItem[]) => {
  if (!db) return;
  const registryRef = ref(db, 'school_registry_linked');
  try {
    await set(registryRef, newRegistry);
  } catch (error: any) {
    console.error("Erro ao salvar cadastros:", error);
    alert("ERRO AO SALVAR: Verifique se as Regras do Firebase permitem escrita.");
  }
};