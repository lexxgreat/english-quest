/**
 * Распознавание речи (диктовка вслух) через Web Speech API.
 * Chrome/Android — да; Safari на iPhone (14.5+) — да; офлайн или нет API — честный фолбэк.
 * Требует HTTPS и разрешения на микрофон.
 */

export type ListenFail = 'no-api' | 'error' | 'no-speech'

export function speechAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, any>
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

/**
 * Послушать один раз.
 * onText — что услышали; onFail — почему не получилось.
 * Возвращает функцию отмены (для размонтирования).
 */
export function listenOnce(
  onText: (text: string) => void,
  onFail: (r: ListenFail) => void,
  maxMs = 10000,
): () => void {
  const w = window as unknown as Record<string, any>
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) {
    onFail('no-api')
    return () => {}
  }

  let rec: any
  let done = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const finish = (fn: () => void) => {
    if (done) return
    done = true
    if (timer) clearTimeout(timer)
    try { rec?.abort() } catch { /* пусто */ }
    fn()
  }

  try {
    rec = new Ctor()
  } catch {
    onFail('error')
    return () => {}
  }

  rec.lang = 'en-US'
  rec.interimResults = false
  rec.maxAlternatives = 3

  rec.onresult = (e: any) => {
    let text = ''
    for (let i = 0; i < e.results.length; i++) {
      text += ' ' + (e.results[i][0]?.transcript || '')
    }
    finish(() => onText(text.trim()))
  }
  rec.onerror = () => finish(() => onFail('error'))
  rec.onend = () => finish(() => onFail('no-speech'))

  timer = setTimeout(() => finish(() => onFail('no-speech')), maxMs)

  try {
    rec.start()
  } catch {
    finish(() => onFail('error'))
  }

  return () => finish(() => onFail('no-speech'))
}
