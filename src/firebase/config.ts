/** ============================================================
 *  FIREBASE — КОНФИГ
 *  Вставь сюда firebaseConfig из Firebase Console
 *  (Настройки проекта → Ваши приложения → Web-приложение).
 *  Пока поля пустые — приложение работает полностью локально.
 *  ============================================================ */

export const FIREBASE_CONFIG = {
  apiKey: '',            // ← сюда
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export const cloudEnabled = Boolean(FIREBASE_CONFIG.apiKey)
