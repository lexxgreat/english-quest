import React from 'react'
import { Route } from '../App'
import { useStore, dueWords } from '../lib/store'

const MODES: { mode: string; icon: string; title: string; desc: string; color: string }[] = [
  { mode: 'cards', icon: '🃏', title: 'Знакомство', desc: 'Новые слова: слушай и смотри', color: 'from-sky-400 to-cyan-500' },
  { mode: 'quiz_en_ru', icon: '🎯', title: 'Выбери перевод', desc: 'Видишь слово — найди перевод', color: 'from-orange-400 to-amber-500' },
  { mode: 'quiz_ru_en', icon: '🔁', title: 'Наоборот', desc: 'Перевод — найди английское слово', color: 'from-violet-400 to-purple-500' },
  { mode: 'listen', icon: '👂', title: 'Слушай и выбирай', desc: 'Тренируй уши', color: 'from-emerald-400 to-teal-500' },
  { mode: 'spell', icon: '✍️', title: 'Правописание', desc: 'Впиши слово по-английски', color: 'from-rose-400 to-pink-500' },
]

export default function Train({ go }: { go: (r: Route) => void }) {
  const words = useStore(s => s.words)
  const started = Object.keys(words).length
  const due = dueWords(words).length

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-1 text-2xl font-black text-slate-800">🎯 Тренировки</h1>
      <p className="mb-5 text-sm text-slate-400">
        В словаре: {started} слов · к повторению: {due}
      </p>

      <div className="flex flex-col gap-3">
        {MODES.map(m => (
          <button
            key={m.mode}
            onClick={() => { window.location.hash = `/lesson?mode=${m.mode}` }}
            className={`flex items-center gap-4 rounded-3xl bg-gradient-to-r ${m.color} p-4 text-left text-white shadow-lg active:scale-[0.98] transition`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-3xl">{m.icon}</span>
            <span className="flex-1">
              <span className="block text-lg font-black">{m.title}</span>
              <span className="block text-xs opacity-90">{m.desc}</span>
            </span>
            <span className="text-2xl opacity-70">→</span>
          </button>
        ))}

        <button
          onClick={() => go('pairs')}
          className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-indigo-400 to-blue-500 p-4 text-left text-white shadow-lg active:scale-[0.98] transition"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-3xl">🧩</span>
          <span className="flex-1">
            <span className="block text-lg font-black">Найди пару</span>
            <span className="block text-xs opacity-90">Игра на память: слово + перевод</span>
          </span>
          <span className="text-2xl opacity-70">→</span>
        </button>
      </div>
    </div>
  )
}
