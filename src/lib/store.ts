import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WORDS } from './words'

export interface WordProgress {
  box: number          // 0 = новое, 1..5 = ящик Лейтнера
  due: string | null   // дата следующего показа 'YYYY-MM-DD'
  seen: number         // показов всего
  ok: number           // правильных ответов
  wrong: number        // неправильных ответов
  introduced: boolean  // слово уже «представлено» в уроке
}

export interface DailyCounter { date: string; newDone: number; revDone: number; answers: number; correct: number }

/** Итоги ответов за сегодня (по слову) — для проверки родителем */
export type DailyWordResults = Record<number, { ok: number; fail: number }>

/** План на день: фиксируется утром/при изменении, чтобы список на главной совпадал с уроком */
export interface DayPlan { date: string; sig: string; newIds: number[]; revIds: number[] }

/** Итог по предложению дня (наизусть: написать/сказать/родителю) */
export interface SentenceResult { en: string; ok: boolean; mode: 'write' | 'speak' | 'parent'; hints: number }

export interface Settings {
  dailyNew: number     // новых слов в день
  dailyReviews: number // повторений в день
  ttsRate: number      // скорость речи
}

export interface ProgressData {
  words: Record<number, WordProgress>
  xp: number
  answered: number
  correct: number
  activeDays: string[]
  streak: number
  lastActive: string | null
  achievements: string[]
  daily: DailyCounter
  dailyWordResults: DailyWordResults
  dailySentences: SentenceResult[]  // итог дня: предложения наизусть
  wordOrder: number[] | null   // пользовательский порядок очереди новых слов
  pinnedToday: number[]        // слова, закреплённые пользователем на сегодня
  wodPin: number | null        // слово дня, выбранное вручную
  plan: DayPlan | null
  storiesRead: string[]
  updatedAt: number
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyDaily(): DailyCounter {
  return { date: todayStr(), newDone: 0, revDone: 0, answers: 0, correct: 0 }
}

function genCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return s
}

interface StoreState extends ProgressData {
  settings: Settings
  deviceCode: string
  cloudSyncedAt: number | null
  // Действия
  ensureWord: (id: number) => void
  answerWord: (id: number, correct: boolean, isNew: boolean, boxBefore: number) => number
  addXp: (n: number) => void
  touchDay: () => void
  bumpDaily: (kind: 'new' | 'rev' | 'answer', correct?: boolean) => void
  unlock: (id: string) => void
  markStoryRead: (id: string) => void
  resetWord: (id: number) => void
  resetAll: () => void
  setSettings: (s: Partial<Settings>) => void
  setTtsRate: (r: number) => void
  setCloudSynced: () => void
  setWordOrder: (order: number[] | null) => void
  moveWordInQueue: (id: number, dir: -1 | 1) => void
  togglePinToday: (id: number) => void
  setWod: (id: number | null) => void
  setPlan: (p: DayPlan | null) => void
  recordSentence: (en: string, ok: boolean, mode: 'write' | 'speak' | 'parent', hints: number) => void
  importData: (d: Partial<ProgressData>) => void
  ensureToday: () => void
}

const defaultData = (): ProgressData => ({
  words: {},
  xp: 0,
  answered: 0,
  correct: 0,
  activeDays: [],
  streak: 0,
  lastActive: null,
  achievements: [],
  daily: emptyDaily(),
  dailyWordResults: {},
  dailySentences: [],
  wordOrder: null,
  pinnedToday: [],
  wodPin: null,
  plan: null,
  storiesRead: [],
  updatedAt: Date.now(),
})

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...defaultData(),
      settings: { dailyNew: 7, dailyReviews: 20, ttsRate: 0.95 },
      deviceCode: genCode(),
      cloudSyncedAt: null,

      ensureToday: () => {
        const s = get()
        if (s.daily.date !== todayStr()) set({ daily: emptyDaily(), dailyWordResults: {}, dailySentences: [] })
      },

      ensureWord: (id) => {
        const s = get()
        if (s.words[id]) return
        set({
          words: { ...s.words, [id]: { box: 0, due: null, seen: 0, ok: 0, wrong: 0, introduced: false } },
          updatedAt: Date.now(),
        })
      },

      answerWord: (id, correct, isNew, boxBefore) => {
        const s = get()
        const w = s.words[id] || { box: 0, due: null, seen: 0, ok: 0, wrong: 0, introduced: true }
        const nextBox = correct ? Math.min(5, boxBefore + 1) : 1
        const due = nextBox === 1 && !correct ? todayStr() : addDays(todayStr(), INTERVALS[nextBox])
        const dwr = s.daily.date === todayStr() ? s.dailyWordResults : {}
        set({
          words: {
            ...s.words,
            [id]: { ...w, box: nextBox, due, seen: w.seen + 1, ok: w.ok + (correct ? 1 : 0), wrong: w.wrong + (correct ? 0 : 1), introduced: true },
          },
          answered: s.answered + 1,
          correct: s.correct + (correct ? 1 : 0),
          dailyWordResults: { ...dwr, [id]: { ok: (dwr[id]?.ok || 0) + (correct ? 1 : 0), fail: (dwr[id]?.fail || 0) + (correct ? 0 : 1) } },
          updatedAt: Date.now(),
        })
        // XP: за правильный ответ, бонус за сложные режимы начисляется снаружи
        const gained = correct ? (isNew ? 3 : 2) : 0
        if (gained) get().addXp(gained)
        get().bumpDaily(isNew ? 'new' : 'rev', correct)
        return gained
      },

      addXp: (n) => set((s) => ({ xp: s.xp + n, updatedAt: Date.now() })),

      touchDay: () => {
        const s = get()
        const t = todayStr()
        if (s.lastActive === t) return
        const yesterday = addDays(t, -1)
        const streak = s.lastActive === yesterday ? s.streak + 1 : 1
        set({ lastActive: t, streak, activeDays: [...new Set([...s.activeDays, t])].slice(-400), updatedAt: Date.now() })
      },

      bumpDaily: (kind, correct = false) => {
        const s = get()
        const d = s.daily.date === todayStr() ? s.daily : emptyDaily()
        const nd: DailyCounter = {
          ...d,
          newDone: d.newDone + (kind === 'new' ? 1 : 0),
          revDone: d.revDone + (kind === 'rev' ? 1 : 0),
          answers: d.answers + 1,
          correct: d.correct + (correct ? 1 : 0),
        }
        set({ daily: nd, updatedAt: Date.now() })
      },

      unlock: (id) => {
        const s = get()
        if (s.achievements.includes(id)) return
        set({ achievements: [...s.achievements, id], updatedAt: Date.now() })
      },

      markStoryRead: (id) => {
        const s = get()
        if (s.storiesRead.includes(id)) return
        set({ storiesRead: [...s.storiesRead, id], updatedAt: Date.now() })
      },

      resetWord: (id) => {
        const s = get()
        const words = { ...s.words }
        delete words[id]
        set({ words, updatedAt: Date.now() })
      },

      resetAll: () => set({ ...defaultData(), daily: emptyDaily() }),

      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setTtsRate: (r) => set((s) => ({ settings: { ...s.settings, ttsRate: r } })),
      setCloudSynced: () => set({ cloudSyncedAt: Date.now() }),

      setWordOrder: (order) => set({ wordOrder: order, updatedAt: Date.now() }),

      moveWordInQueue: (id, dir) => {
        const s = get()
        const base = [...(s.wordOrder ?? WORDS.map(w => w.id))]
        const i = base.indexOf(id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= base.length) return
        ;[base[i], base[j]] = [base[j], base[i]]
        set({ wordOrder: base, updatedAt: Date.now() })
      },

      togglePinToday: (id) => {
        const s = get()
        const has = s.pinnedToday.includes(id)
        set({ pinnedToday: has ? s.pinnedToday.filter(x => x !== id) : [...s.pinnedToday, id], updatedAt: Date.now() })
      },

      setWod: (id) => set({ wodPin: id, updatedAt: Date.now() }),
      setPlan: (p) => set({ plan: p }),

      recordSentence: (en, ok, mode, hints) => {
        const s = get()
        const rest = (s.dailySentences || []).filter(x => x.en !== en)
        set({ dailySentences: [...rest, { en, ok, mode, hints }], updatedAt: Date.now() })
      },

      importData: (d) => {
        const s = get()
        set({
          words: d.words ?? s.words,
          xp: d.xp ?? s.xp,
          answered: d.answered ?? s.answered,
          correct: d.correct ?? s.correct,
          activeDays: d.activeDays ?? s.activeDays,
          streak: d.streak ?? s.streak,
          lastActive: d.lastActive ?? s.lastActive,
          achievements: d.achievements ?? s.achievements,
          daily: d.daily ?? s.daily,
          dailyWordResults: d.dailyWordResults ?? s.dailyWordResults,
          dailySentences: d.dailySentences ?? s.dailySentences,
          wordOrder: d.wordOrder ?? s.wordOrder,
          pinnedToday: d.pinnedToday ?? s.pinnedToday,
          wodPin: d.wodPin ?? s.wodPin,
          storiesRead: d.storiesRead ?? s.storiesRead,
          updatedAt: Date.now(),
        })
      },
    }),
    {
      name: 'english-quest-v1',
      version: 3,
      migrate: (persisted: any) => ({
        dailyWordResults: {},
        dailySentences: [],
        wordOrder: null,
        pinnedToday: [],
        wodPin: null,
        plan: null,
        ...persisted,
      }),
    },
  ),
)

export const INTERVALS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 }

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Экспорт/импорт прогресса файлом
export function exportProgress(): string {
  const s = useStore.getState()
  return JSON.stringify({ app: 'english-quest', v: 1, exportedAt: new Date().toISOString(), data: { words: s.words, xp: s.xp, answered: s.answered, correct: s.correct, activeDays: s.activeDays, streak: s.streak, lastActive: s.lastActive, achievements: s.achievements, storiesRead: s.storiesRead, wordOrder: s.wordOrder, pinnedToday: s.pinnedToday, wodPin: s.wodPin, dailySentences: s.dailySentences } }, null, 2)
}

export function downloadProgress() {
  const blob = new Blob([exportProgress()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `english-quest-progress-${todayStr()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importProgressFile(file: File): Promise<boolean> {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (parsed?.app !== 'english-quest' || !parsed?.data) return false
    useStore.getState().importData(parsed.data)
    return true
  } catch {
    return false
  }
}

// Селекторы-помощники
export function learnedCount(words: Record<number, WordProgress>): number {
  return Object.values(words).filter(w => w.box >= 3).length
}
export function inProgressCount(words: Record<number, WordProgress>): number {
  return Object.values(words).filter(w => w.box > 0 && w.box < 3).length
}
export function dueWords(words: Record<number, WordProgress>): number[] {
  const t = todayStr()
  return Object.entries(words)
    .filter(([, w]) => w.box > 0 && w.due && w.due <= t)
    .map(([id]) => Number(id))
}
