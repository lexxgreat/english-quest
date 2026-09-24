import React, { useMemo, useState } from 'react'
import { WORDS, LEVELS, wordById } from '../lib/words'
import { useStore } from '../lib/store'
import { ensurePlan } from '../lib/srs'
import { AudioBtn, Btn, Card, WordDetail } from '../components/ui'
import { Route } from '../App'

/**
 * План слов (для родителя):
 *  — весь словарь в текущем порядке очереди новых слов;
 *  — ↑↓ двигают слово по очереди;
 *  — 📅 закрепляет слово в уроке на сегодня.
 */
export default function Plan({ go }: { go: (r: Route) => void }) {
  const wordOrder = useStore(s => s.wordOrder)
  const pinned = useStore(s => s.pinnedToday)
  const wordsProgress = useStore(s => s.words)
  const moveWordInQueue = useStore(s => s.moveWordInQueue)
  const togglePinToday = useStore(s => s.togglePinToday)
  const setWordOrder = useStore(s => s.setWordOrder)
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<number | null>(null)
  const [onlyQueue, setOnlyQueue] = useState(false)
  const [detail, setDetail] = useState<number | null>(null)

  const order = useMemo(() => {
    const base = wordOrder ?? WORDS.map(w => w.id)
    return base.map(id => wordById(id)).filter((w): w is NonNullable<typeof w> => !!w)
  }, [wordOrder])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return order.filter(w => {
      if (level && w.level !== level) return false
      const p = wordsProgress[w.id]
      if (onlyQueue && (p && p.box > 0)) return false
      if (!query) return true
      return w.en.toLowerCase().includes(query) || w.ru.toLowerCase().includes(query)
    })
  }, [order, q, level, onlyQueue, wordsProgress])

  function onPin(id: number) {
    togglePinToday(id)
    ensurePlan() // сразу пересобираем план дня, чтобы главная показала обновление
  }

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => go('more')} className="h-10 w-10 rounded-full bg-white text-lg shadow active:bg-slate-50" aria-label="Назад">←</button>
        <h1 className="text-xl font-black text-slate-800">📋 План слов</h1>
      </div>

      {/* Закреплённые на сегодня */}
      <Card className="mb-4">
        <h2 className="font-black text-slate-800">📅 На сегодня: {pinned.length}</h2>
        {pinned.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Ничего не закреплено — урок берёт слова автоматически по очереди ниже. Нажми 📅 у слова, чтобы добавить его в урок на сегодня.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {pinned.map(id => {
              const w = wordById(id)
              if (!w) return null
              return (
                <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 py-1.5 pl-3 pr-1.5 text-sm font-bold text-orange-700">
                  {w.en}
                  <button onClick={() => onPin(id)} aria-label="Убрать из сегодняшних" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-xs active:bg-white">✕</button>
                </span>
              )
            })}
          </div>
        )}
        <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-400">
          Как это работает: список ниже — очередь новых слов. ↑↓ меняют порядок, 📅 добавляет слово в урок на сегодня (первым). Проверить сына можно на главной в «Словах на сегодня» после урока.
        </p>
      </Card>

      {/* Поиск и фильтры */}
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Поиск: по-английски или по-русски…"
        className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-orange-400"
      />
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setLevel(null)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${!level ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Все</button>
        {LEVELS.map(L => (
          <button key={L.n} onClick={() => setLevel(L.n)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${level === L.n ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {L.emoji} {L.name}
          </button>
        ))}
        <button onClick={() => setOnlyQueue(v => !v)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${onlyQueue ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
          🌱 только новые
        </button>
      </div>

      {/* Список слов */}
      <div className="mt-4 flex flex-col gap-1.5">
        {filtered.map((w) => {
          const p = wordsProgress[w.id]
          const dot = !p || p.box === 0 ? 'bg-slate-200' : p.box >= 3 ? 'bg-emerald-400' : 'bg-orange-400'
          const isPinned = pinned.includes(w.id)
          return (
            <div key={w.id} className={`flex items-center gap-1.5 rounded-2xl bg-white p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${isPinned ? 'ring-2 ring-orange-300' : ''}`}>
              <button onClick={() => setDetail(w.id)} className="min-w-0 flex-1 text-left">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-black text-slate-800">{w.en}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                </span>
                <span className="block truncate text-xs text-slate-400">{w.ru}</span>
              </button>
              <AudioBtn word={w.en} size="sm" />
              <button onClick={() => moveWordInQueue(w.id, -1)} aria-label="Выше в очереди"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500 active:bg-slate-200">↑</button>
              <button onClick={() => moveWordInQueue(w.id, 1)} aria-label="Ниже в очереди"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500 active:bg-slate-200">↓</button>
              <button onClick={() => onPin(w.id)} aria-label={isPinned ? 'Убрать из сегодняшних' : 'На сегодня'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base active:opacity-70 ${isPinned ? 'bg-orange-500 text-white' : 'bg-slate-100'}`}>📅</button>
            </div>
          )
        })}
        {!filtered.length && <p className="py-10 text-center text-sm text-slate-400">Ничего не нашлось 🤷</p>}
      </div>

      {wordOrder && (
        <Btn variant="soft" className="mb-6 mt-4 h-12 w-full" onClick={() => { if (confirm('Вернуть стандартный порядок слов?')) setWordOrder(null) }}>
          ↩️ Сбросить порядок
        </Btn>
      )}

      <WordDetail wordId={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
