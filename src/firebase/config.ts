/** ============================================================
 *  FIREBASE — КОНФИГ (проект eng-quest-d7d36, отдельный от Хэзэнштейна)
 *  Анонимный вход без логина; прогресс дублируется в Firestore
 *  в документ progress/{deviceCode}.
 *  ============================================================ */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA3lnDTjHEDtoUs2IcgHwQR4KdujGqeJjA',
  authDomain: 'eng-quest-d7d36.firebaseapp.com',
  projectId: 'eng-quest-d7d36',
  storageBucket: 'eng-quest-d7d36.firebasestorage.app',
  messagingSenderId: '979604290250',
  appId: '1:979604290250:web:f943b76a87dbfaa0285233',
}

export const cloudEnabled = Boolean(FIREBASE_CONFIG.apiKey)
