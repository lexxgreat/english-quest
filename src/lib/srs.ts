import { WORDS, WORD_BY_ID, Word, shuffle, sample } from './words'
import { useStore, WordProgress, todayStr, DayPlan } from './store'

/** Слова, которые пользователь ещё не начал учить — в порядке очереди (учитывает ручной порядок) */
export function unseenIds(): number[] {
  const s = useStore.getState()
  const words = s.words
  const unseen = WORDS.filter(w => !words[w.id]).map(w => w.id)
  if (!s.wordOrder) return unseen
  const inOrder = s.wordOrder.filter(id => !words[id] && WORD_BY_ID.has(id))
  const rest = unseen.filter(id => !inOrder.includes(id))
  return [...inOrder, ...rest]
}

/** Слова к повторению сегодня */
export function dueToday(): number[] {
  const words = useStore.getState().words
  const t = todayStr()
  return Object.entries(words)
    .filter(([, w]) => w.box > 0 && w.due && w.due <= t)
    .map(([id]) => Number(id))
    .filter(id => WORD_BY_ID.has(id))
}

export interface QueueItem {
  kind: 'intro' | 'quiz_en_ru' | 'quiz_ru_en' | 'listen' | 'spell'
  wordId: number
  isNew: boolean
}

/** Выбор типа упражнения в зависимости от ящика слова */
function exerciseForBox(box: number, wordId: number, isNew: boolean): QueueItem[] {
  if (isNew) return [
    { kind: 'intro', wordId, isNew },
    { kind: 'quiz_en_ru', wordId, isNew },
    { kind: 'listen', wordId, isNew },
  ]
  const variants: Record<number, QueueItem['kind'][]> = {
    1: ['quiz_en_ru', 'listen'],
    2: ['listen', 'quiz_en_ru'],
    3: ['quiz_ru_en', 'listen'],
    4: ['quiz_ru_en', 'spell'],
    5: ['spell', 'quiz_ru_en'],
  }
  const list = variants[Math.max(1, Math.min(5, box))] || ['quiz_en_ru']
  return [{ kind: list[wordId % list.length], wordId, isNew }]
}

/* ===================== План на день ===================== */

/** Подпись условий плана: закреплённые слова + настройки. Меняются → план перестраивается */
export function planSignature(): string {
  const s = useStore.getState()
  return JSON.stringify({
    p: [...s.pinnedToday].sort((a, b) => a - b),
    dn: s.settings.dailyNew,
    dr: s.settings.dailyReviews,
  })
}

/**
 * План на день — ЕДИНЫЙ для превью на главной и для урока:
 * сначала закреплённые (📅), потом новые по очереди, потом повторения.
 * Перестраивается при смене дня или изменении закреплений/настроек.
 */
export function ensurePlan(): DayPlan {
  const st = useStore.getState()
  st.ensureToday()
  const s = useStore.getState()
  const sig = planSignature()
  if (s.plan && s.plan.date === todayStr() && s.plan.sig === sig) return s.plan

  const pinnedSeen = s.pinnedToday.filter(id => s.words[id] && s.words[id].box > 0 && WORD_BY_ID.has(id))
  const pinnedNew = s.pinnedToday.filter(id => (!s.words[id] || s.words[id].box === 0) && WORD_BY_ID.has(id))
  const queue = unseenIds().filter(id => !pinnedNew.includes(id))

  const newIds = [...pinnedNew, ...queue.slice(0, Math.max(0, s.settings.dailyNew - pinnedNew.length))]

  // Повторения: закреплённые «в процессе» + отвечённые сегодня + просроченные по расписанию
  const answeredToday = Object.keys(s.dailyWordResults || {}).map(Number).filter(id => WORD_BY_ID.has(id))
  const due = dueToday().filter(id => !pinnedSeen.includes(id) && !answeredToday.includes(id))
  const revIds = [...new Set([...pinnedSeen, ...answeredToday, ...due])]
    .slice(0, Math.max(s.settings.dailyReviews, pinnedSeen.length + answeredToday.length))

  const plan: DayPlan = { date: todayStr(), sig, newIds, revIds }
  s.setPlan(plan)
  return plan
}

/** Урок дня: знакомство с новыми словами плана + упражнения по плану и текущим просрочкам */
export function buildDailyQueue(): QueueItem[] {
  const plan = ensurePlan()
  const s = useStore.getState()
  const dwr = s.dailyWordResults || {}
  const doneToday = (id: number) => (dwr[id]?.ok || 0) > 0

  const intros = plan.newIds.filter(id => {
    const wp = s.words[id]
    return !wp || !wp.introduced
  })

  const exerciseIds = [...new Set([...plan.newIds, ...plan.revIds, ...dueToday()])]
    .filter(id => !doneToday(id) && WORD_BY_ID.has(id))

  const items: QueueItem[] = intros.map(id => ({ kind: 'intro', wordId: id, isNew: true }))
  const pool: QueueItem[] = []
  for (const id of exerciseIds) {
    const wp = s.words[id]
    pool.push(...exerciseForBox(wp?.box ?? 1, id, !wp || wp.box === 0).filter(i => i.kind !== 'intro'))
  }
  items.push(...shuffle(pool))
  return items
}

/** Свободная тренировка выбранным режимом */
export function buildModeQueue(kind: 'quiz_en_ru' | 'quiz_ru_en' | 'listen' | 'spell' | 'cards', count = 12): QueueItem[] {
  if (kind === 'cards') {
    // «Знакомство»: до 10 ещё не начатых слов (по очереди)
    const ids = unseenIds().slice(0, 10)
    return shuffle(ids).map(id => ({ kind: 'intro', wordId: id, isNew: true }))
  }
  const s = useStore.getState()
  const started = Object.entries(s.words).filter(([, w]) => w.box > 0).map(([id]) => Number(id))
  const pool = started.length >= count
    ? shuffle(started).slice(0, count)
    : [...shuffle(started), ...sample(shuffle(unseenIds()), count - started.length)]
  return pool.map(id => ({
    kind,
    wordId: id,
    isNew: !s.words[id] || s.words[id].box === 0,
  }))
}

/* ===================== Слово дня ===================== */

/**
 * Слово дня — из самых употребимых слов (уровни 1–2), детерминировано по дате,
 * без повторов в пределах последних 45 дней. Пользователь может закрепить своё (wodPin).
 */
export function wordOfTheDay(): Word {
  const s = useStore.getState()
  if (s.wodPin && WORD_BY_ID.has(s.wodPin)) return WORD_BY_ID.get(s.wodPin)!
  const pool = WORDS.filter(w => w.level <= 2)
  const days = Math.floor(Date.now() / 86400000)
  const idx = ((days % pool.length) + pool.length) % pool.length
  const recent = new Set<number>()
  for (let d = 1; d <= 45; d++) {
    recent.add(pool[(((days - d) % pool.length) + pool.length) % pool.length].id)
  }
  for (let k = 0; k < pool.length; k++) {
    const cand = pool[(idx + k) % pool.length]
    if (!recent.has(cand.id)) return cand
  }
  return pool[idx]
}

/** Прогресс по ящикам для экрана статистики */
export function boxDistribution(): number[] {
  const words = useStore.getState().words
  const dist = [0, 0, 0, 0, 0, 0]
  for (const w of Object.values(words)) dist[Math.min(5, Math.max(0, w.box))]++
  return dist
}

export function wordState(id: number): WordProgress | undefined {
  return useStore.getState().words[id]
}
