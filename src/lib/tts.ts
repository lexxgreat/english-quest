/** Озвучка через Web Speech API — бесплатно, без аудиофайлов, работает офлайн на Android/Chrome */

let cachedVoice: SpeechSynthesisVoice | null = null
let ttsRate = 0.95

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const synth = window.speechSynthesis
  if (!synth) return null
  const voices = synth.getVoices()
  if (!voices.length) return null
  cachedVoice =
    voices.find(v => /en[-_]US/i.test(v.lang) && /google/i.test(v.name)) ||
    voices.find(v => /en[-_]US/i.test(v.lang) && /natural|samantha|aria/i.test(v.name)) ||
    voices.find(v => /en[-_]US/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    null
  return cachedVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // Голоса подгружаются асинхронно — прогреваем
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice() }
  pickVoice()
}

export function setTtsRate(rate: number) {
  ttsRate = rate
}

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel() } catch { /* пусто */ }
}

interface SpeakOpts { slow?: boolean; onEnd?: () => void; rate?: number }

export function speak(text: string, opts: SpeakOpts = {}) {
  const synth = window.speechSynthesis
  if (!synth) { opts.onEnd?.(); return }
  try {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice()
    if (voice) u.voice = voice
    u.lang = voice?.lang || 'en-US'
    u.rate = opts.rate ?? (opts.slow ? Math.max(0.5, ttsRate - 0.35) : ttsRate)
    u.pitch = 1.05
    if (opts.onEnd) u.onend = () => opts.onEnd!()
    // Небольшая задержка помогает на iOS после первого жеста
    setTimeout(() => synth.speak(u), 40)
  } catch {
    opts.onEnd?.()
  }
}

/** Проговаривает слово, затем пример — для карточек */
export function speakWordWithExample(word: string, example: string) {
  speak(word)
  setTimeout(() => speak(example), 900)
}
