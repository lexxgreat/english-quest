import React, { useMemo, useState } from 'react'
import { WORDS, TOPIC_RU, LEVELS, Word } from '../lib/words'
import { useStore, learnedCount } from '../lib/store'
import { AudioBtn, WordDetail, Chip } from '../components/ui'

type StatusFilter = 'all' | 'learning' | 'known'

export default function Words() {
  const words = useStore(s => s.words)
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<number | null>(null)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [detail, setDetail] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return WORDS.filter(w => {
      if (level && w.level !== level) return false
      const p = words[w.id]
      if (status === 'known' && (!p || p.box < 3)) return false
      if (status === 'learning' && (!p || p.box === 0)) return false
      if (!query) return true
      return w.en.toLowerCase().includes(query) || w.ru.toLowerCase().includes(query)
    })
  }, [q, level, status, words])

  const known = learnedCount(words)

  return (
    <div className="px-4 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">📚 Словарь</h1>
        <Chip className="bg-emerald-100 text-emerald-600">выучено {known}/{WORDS.length}</Chip>
      </div>

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
      </div>
      <div className="mt-2 flex gap-1.5">
        {([['all', 'Все'], ['learning', '🌱 Изучаю'], ['known', '✅ Знаю']] as [StatusFilter, string][]).map(([v, label]) => (
          <button key={v} onClick={() => setStatus(v)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${status === v ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.map(w => <WordRow key={w.id} w={w} onOpen={() => setDetail(w.id)} />)}
        {!filtered.length && (
          <p className="py-10 text-center text-sm text-slate-400">Ничего не нашлось 🤷</p>
        )}
      </div>

      <WordDetail wordId={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

function WordRow({ w, onOpen }: { w: Word; onOpen: () => void }) {
  const p = useStore(s => s.words[w.id])
  const dot = !p || p.box === 0 ? 'bg-slate-200' : p.box >= 3 ? 'bg-emerald-400' : 'bg-orange-400'
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:bg-orange-50">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-base font-black text-slate-800">{w.en}</span>
          <span className="hidden truncate text-xs text-slate-300 sm:inline">{w.ipa}</span>
        </span>
        <span className="block truncate text-sm text-slate-400">{w.ru}</span>
      </span>
      <span className="text-[10px] font-bold text-slate-300">{TOPIC_RU[w.topic]}</span>
      <span onClick={e => e.stopPropagation()}><AudioBtn word={w.en} size="sm" /></span>
    </button>
  )
}
