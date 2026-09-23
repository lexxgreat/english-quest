import { WORDS, WORD_BY_ID, shuffle, sample } from './words'
import { useStore, WordProgress, todayStr } from './store'

/** Слова, которые пользователь ещё не начал учить (box = 0 не должно существовать в store — новые берутся из общей базы) */
export function unseenIds(): number[] {
  const words = useStore.getState().words
  return WORDS.filter(w => !words[w.id]).map(w => w.id)
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

/** Урок дня: повторения + новые слова */
export function buildDailyQueue(): QueueItem[] {
  const st = useStore.getState()
  st.ensureToday()
  const s = useStore.getState()
  const reviews = dueToday()
  const newGoal = Math.max(0, s.settings.dailyNew - s.daily.newDone)
  const newIds = sample(shuffle(unseenIds()), newGoal)
  const revGoal = Math.max(0, s.settings.dailyReviews - s.daily.revDone)

  const items: QueueItem[] = []
  // Сначала знакомство с новыми словами
  for (const id of newIds) {
    items.push({ kind: 'intro', wordId: id, isNew: true })
  }
  // Затем перемешанные упражнения по новым и повторениям
  const exercisePool: QueueItem[] = []
  for (const id of newIds) exercisePool.push(...exerciseForBox(1, id, true).filter(i => i.kind !== 'intro'))
  const revShuffled = shuffle(reviews).slice(0, revGoal)
  for (const id of revShuffled) {
    const w = s.words[id]
    exercisePool.push(...exerciseForBox(w?.box ?? 1, id, false))
  }
  items.push(...shuffle(exercisePool))
  return items
}

/** Свободная тренировка выбранным режимом */
export function buildModeQueue(kind: 'quiz_en_ru' | 'quiz_ru_en' | 'listen' | 'spell' | 'cards', count = 12): QueueItem[] {
  if (kind === 'cards') {
    // «Знакомство»: до 10 ещё не начатых слов
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
