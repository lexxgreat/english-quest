/**
 * Установка PWA.
 *
 * Chrome с 89-й версии НЕ показывает предложение установки сам — событие
 * beforeinstallprompt нужно перехватить и показать свою кнопку установки.
 * Safari на iPhone вообще не умеет prompt() — там только инструкция
 * «Поделиться → На экран „Домой“».
 */

type BIPEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BIPEvent | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

/** Вызвать один раз до рендера React (событие может прилететь рано) */
export function initInstallCapture() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BIPEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    try { localStorage.removeItem('eq-install-dismissed') } catch { /* noop */ }
    notify()
  })
}

/** Браузер уже готов показать системный диалог установки? */
export function canInstall(): boolean {
  return deferredPrompt != null
}

/** Открыто уже как установленное приложение (без адресной строки)? */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true // iOS Safari
  )
}

export type Platform = 'ios' | 'android' | 'desktop'

export function platform(): Platform {
  const ua = navigator.userAgent
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPad|iPhone|iPod/.test(ua) || iPadOS) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

/** Показать системный диалог установки (Android/Chrome/Edge). */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable'
  try {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
    return outcome
  } catch {
    return 'unavailable'
  }
}

/** Подписка на изменения состояния установки */
export function onInstallChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

/** Скрыть подсказку на несколько дней (кнопка «позже») */
export function dismissInstallHint(days = 5) {
  try { localStorage.setItem('eq-install-dismissed', String(Date.now() + days * 864e5)) } catch { /* noop */ }
  notify()
}

export function installHintDismissed(): boolean {
  try {
    return Number(localStorage.getItem('eq-install-dismissed') || 0) > Date.now()
  } catch {
    return false
  }
}
