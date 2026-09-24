/**
 * Сравнение предложений для диктанта: нормализация, схожесть, пословный разбор.
 * Используется в «Итоге дня» (предложения наизусть).
 */

/** Токены предложения: только английские слова в нижнем регистре */
export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Расстояние Левенштейна между массивами слов */
function levWords(a: string[], b: string[]): number {
  const m = a.length
  const n = b.length
  const d: number[] = []
  for (let j = 0; j <= n; j++) d[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return d[n]
}

/** Схожесть двух фраз 0..1 — для проверки «сказанного вслух» */
export function similarity(said: string, target: string): number {
  const a = tokens(said)
  const b = tokens(target)
  if (!a.length || !b.length) return 0
  return 1 - levWords(a, b) / Math.max(a.length, b.length)
}

/**
 * Диктант написан верно? Точное совпадение слов по позициям,
 * но прощаем ОДНУ опечатку в одном слове длиннее 4 букв (детям положено).
 */
export function dictationOk(answer: string, target: string): boolean {
  const a = tokens(answer)
  const b = tokens(target)
  if (!a.length || a.length !== b.length) return false
  let penalty = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    const allowance = b[i].length > 4 ? 1 : 0
    if (Math.abs(a[i].length - b[i].length) <= 1 && levWords([a[i]], [b[i]]) <= allowance) {
      penalty += 1
    } else {
      penalty += 2
    }
  }
  return penalty <= 1
}

/** Пословная сверка для показа после ошибки: что пропущено, что лишнее */
export function wordDiff(target: string, answer: string): { ok: string[]; missing: string[]; extra: string[] } {
  const t = tokens(target)
  const pool = [...tokens(answer)]
  const ok: string[] = []
  const missing: string[] = []
  for (const w of t) {
    const i = pool.indexOf(w)
    if (i >= 0) {
      ok.push(w)
      pool.splice(i, 1)
    } else {
      missing.push(w)
    }
  }
  return { ok, missing, extra: pool }
}

/** Левенштейн между двумя словами (для мелких отличий) */
export function levWord(a: string, b: string): number {
  return levWords([a], [b])
}
