import { cloudEnabled, FIREBASE_CONFIG } from './config'
import { useStore } from '../lib/store'

export type SyncStatus = 'off' | 'ok' | 'error' | 'syncing'
export const syncState: { status: SyncStatus; lastError: string } = { status: 'off', lastError: '' }

let db: any = null
let initialized = false
let pushTimer: ReturnType<typeof setTimeout> | null = null

async function init(): Promise<boolean> {
  if (!cloudEnabled) return false
  if (initialized) return !!db
  try {
    const [{ initializeApp }, authMod, dbMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])
    const app = initializeApp(FIREBASE_CONFIG)
    const auth = authMod.getAuth(app)
    db = dbMod.getFirestore(app)
    // Анонимный вход — без логина и пароля
    try {
      await authMod.signInAnonymously(auth)
    } catch (e: any) {
      // Возможно, анонимный вход уже выполнен или включён только что — продолжаем
      if (!String(e?.code || '').includes('already')) throw e
    }
    initialized = true
    return true
  } catch (e: any) {
    syncState.status = 'error'
    syncState.lastError = String(e?.message || e)
    return false
  }
}

/** Снимок прогресса для сохранения */
function snapshot() {
  const s = useStore.getState()
  return {
    words: s.words,
    xp: s.xp,
    answered: s.answered,
    correct: s.correct,
    activeDays: s.activeDays,
    streak: s.streak,
    lastActive: s.lastActive,
    achievements: s.achievements,
    daily: s.daily,
    storiesRead: s.storiesRead,
    updatedAt: s.updatedAt,
    deviceCode: s.deviceCode,
  }
}

/** Отложенная отправка прогресса в облако (после каждого ответа) */
export function scheduleCloudPush() {
  if (!cloudEnabled) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void pushNow(), 3000)
}

export async function pushNow(): Promise<void> {
  if (!cloudEnabled) return
  const ok = await init()
  if (!ok || !db) return
  try {
    syncState.status = 'syncing'
    const { doc, setDoc } = await import('firebase/firestore')
    const code = useStore.getState().deviceCode
    await setDoc(doc(db, 'progress', code), snapshot(), { merge: true })
    useStore.getState().setCloudSynced()
    syncState.status = 'ok'
    syncState.lastError = ''
  } catch (e: any) {
    syncState.status = 'error'
    syncState.lastError = String(e?.message || e)
  }
}

/** Загрузить прогресс по коду восстановления (на новом устройстве) */
export async function restoreByCode(code: string): Promise<boolean> {
  const ok = await init()
  if (!ok || !db) return false
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(db, 'progress', code.trim().toUpperCase()))
    if (!snap.exists()) return false
    const data = snap.data() as any
    useStore.getState().importData(data)
    // Забираем код себе — теперь это устройство синхронизируется с тем же облаком
    useStore.setState({ deviceCode: code.trim().toUpperCase() })
    syncState.status = 'ok'
    return true
  } catch (e: any) {
    syncState.status = 'error'
    syncState.lastError = String(e?.message || e)
    return false
  }
}

/** Стартовая синхронизация: если в облаке новее — берём оттуда */
export async function initialSync(): Promise<void> {
  if (!cloudEnabled) return
  const ok = await init()
  if (!ok || !db) return
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const code = useStore.getState().deviceCode
    const snap = await getDoc(doc(db, 'progress', code))
    if (snap.exists()) {
      const data = snap.data() as any
      const local = useStore.getState().updatedAt
      const cloud = Number(data?.updatedAt || 0)
      if (cloud > local) {
        useStore.getState().importData(data)
        useStore.getState().setCloudSynced()
      }
    }
    syncState.status = 'ok'
    scheduleCloudPush()
  } catch (e: any) {
    syncState.status = 'error'
    syncState.lastError = String(e?.message || e)
  }
}

/** Подписка на изменения прогресса → автосинхронизация */
export function startAutoSync(): void {
  if (!cloudEnabled) return
  let last = useStore.getState().updatedAt
  useStore.subscribe((s) => {
    if (s.updatedAt !== last) {
      last = s.updatedAt
      scheduleCloudPush()
    }
  })
  void initialSync()
}
