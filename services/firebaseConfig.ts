import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { ScheduleItem } from '../types';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAO9x8YDYqauALigdwn88sIH0mz4o1dkq8",
  authDomain: "quadro-de-horarios-cemal.firebaseapp.com",
  // Tente ambas as URLs se der erro. O padrão é a primeira.
  databaseURL: "https://quadro-de-horarios-cemal-default-rtdb.firebaseio.com",
  projectId: "quadro-de-horarios-cemal",
  storageBucket: "quadro-de-horarios-cemal.firebasestorage.app",
  messagingSenderId: "938230155772",
  appId: "1:938230155772:web:233c1988be79c58ad7ca79",
  measurementId: "G-X4GRDELC5Q"
};

// Initialize Firebase
let app;
let db;

// Função auxiliar para inicializar com URL dinâmica (caso o usuário troque na tela de erro)
export const initFirebaseManually = (customUrl: string) => {
    try {
        const config = { ...firebaseConfig, databaseURL: customUrl };
        const newApp = initializeApp(config, 'manual-init-' + Date.now()); // Unique name
        const newDb = getDatabase(newApp);
        db = newDb; // Update global db reference
        console.log("Firebase reinicializado manualmente com URL:", customUrl);
        return true;
    } catch (e) {
        console.error("Erro na reinicialização manual:", e);
        return false;
    }
};

try {
    console.log("Inicializando Firebase App...");
    app = initializeApp(firebaseConfig);
    console.log("Firebase App OK. Obtendo Database...");
    
    // Tenta obter o banco de dados. Se falhar aqui, cai no catch.
    db = getDatabase(app);
    console.log("Firebase Database conectado!");
} catch (error) {
    console.error("ERRO CRÍTICO AO INICIALIZAR FIREBASE:", error);
    // Não lançamos erro aqui para permitir que a UI carregue e mostre a tela de diagnóstico
}

// --- SERVICES ---

export const subscribeToSchedule = (callback: (data: ScheduleItem[]) => void) => {
  if (!db) {
      console.warn("DB não inicializado, ignorando subscribeToSchedule");
      return () => {};
  }
  
  try {
    const scheduleRef = ref(db, 'school_schedule');
    console.log("Inscrevendo em school_schedule...");
    return onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Dados recebidos (Schedule):", data ? "OK" : "Vazio/Null");
      callback(data || []);
    }, (error) => {
      console.error("ERRO DE LEITURA FIREBASE:", error);
      // Dispara um evento global para a UI pegar
      window.dispatchEvent(new CustomEvent('firebase-error', { detail: error.message }));
    });
  } catch (e) {
    console.error("Erro síncrono no subscribeToSchedule:", e);
    return () => {};
  }
};

export const updateSchedule = async (newSchedule: ScheduleItem[]) => {
  if (!db) return;
  try {
    const scheduleRef = ref(db, 'school_schedule');
    await set(scheduleRef, newSchedule);
  } catch (e) {
    console.error("Erro ao salvar horário:", e);
    alert("Erro ao salvar no Firebase. Verifique sua conexão e permissões.");
  }
};

export interface RegistryItem {
    subject: string;
    teachers: string[];
}

export const subscribeToRegistry = (callback: (data: RegistryItem[]) => void) => {
  if (!db) return () => {};

  try {
    const registryRef = ref(db, 'school_registry_linked');
    return onValue(registryRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || []);
    }, (error) => {
        console.error("Erro Registry:", error);
    });
  } catch (e) {
    console.error("Erro síncrono no subscribeToRegistry:", e);
    return () => {};
  }
};

export const updateRegistry = async (newRegistry: RegistryItem[]) => {
  if (!db) return;
  try {
    const registryRef = ref(db, 'school_registry_linked');
    await set(registryRef, newRegistry);
  } catch (e) {
    console.error("Erro ao salvar cadastro:", e);
  }
};