import React from 'react'
import { Route } from '../App'

const ITEMS: { route: Route; icon: string; title: string; desc: string }[] = [
  { route: 'rules', icon: '🔤', title: 'Читать правильно', desc: '14 правил английского чтения' },
  { route: 'plan', icon: '📋', title: 'План слов', desc: 'Порядок изучения и слова на сегодня' },
  { route: 'ach', icon: '🏆', title: 'Ачивки', desc: 'Твои награды' },
  { route: 'settings', icon: '⚙️', title: 'Настройки и прогресс', desc: 'Цель, озвучка, облако, для родителей' },
]

export default function More({ go }: { go: (r: Route) => void }) {
  return (
    <div className="px-4 pt-6">
      <h1 className="mb-4 text-2xl font-black text-slate-800">Ещё</h1>
      <div className="flex flex-col gap-3">
        {ITEMS.map(i => (
          <button key={i.route} onClick={() => go(i.route)}
            className="flex items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_4px_24px_rgba(249,115,22,0.10)] active:scale-[0.98] transition">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">{i.icon}</span>
            <span className="flex-1">
              <span className="block font-black text-slate-800">{i.title}</span>
              <span className="block text-xs text-slate-400">{i.desc}</span>
            </span>
            <span className="text-slate-300">›</span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-300">English Quest v1.4 · учи по 10 минут в день — и через месяц говори!</p>
    </div>
  )
}
