import React, { useEffect, useState } from 'react'
import { READING_RULES, ReadingRule } from '../data/reading'
import { wordById, WORDS } from '../lib/words'
import { speak } from '../lib/tts'
import { AudioBtn, Btn } from '../components/ui'
import { Route } from '../App'

function lookup(clean: string): number | null {
  const c = clean.toLowerCase()
  for (const w of WORDS) if (w.en.toLowerCase() === c) return w.id
  return null
}

export default function ReadingRules({ go }: { go: (r: Route) => void }) {
  const [open, setOpen] = useState<ReadingRule | null>(null)

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => go('more')} className="h-10 w-10 rounded-full bg-white text-lg shadow active:bg-slate-50" aria-label="Назад">←</button>
        <h1 className="text-xl font-black text-slate-800">🔤 Читать правильно</h1>
      </div>

      <div className="mb-4 rounded-2xl bg-orange-50 p-3 text-xs font-semibold text-orange-700">
        Английские слова пишутся не так, как слышатся. Но правил не так много — вот они все! Слушай примеры и повторяй вслух 🔊
      </div>

      <div className="flex flex-col gap-3">
        {READING_RULES.map((r, i) => (
          <button key={r.id} onClick={() => setOpen(r)}
            className="flex items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_4px_24px_rgba(249,115,22,0.10)] active:scale-[0.98] transition">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">{r.icon}</span>
            <span className="flex-1">
              <span className="block font-black text-slate-800">{i + 1}. {r.title}</span>
              <span className="block text-xs font-bold text-orange-400">{r.sound}</span>
            </span>
            <span className="text-slate-300">›</span>
          </button>
        ))}
      </div>

      {open && <RuleSheet rule={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function RuleSheet({ rule, onClose }: { rule: ReadingRule; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="anim-slide relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl safe-bottom max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Закрыть" className="absolute right-4 top-4 h-9 w-9 rounded-full bg-slate-100 text-slate-500 text-lg active:bg-slate-200">✕</button>
        <div className="text-4xl">{rule.icon}</div>
        <h2 className="mt-2 text-xl font-black text-slate-800">{rule.title}</h2>
        <div className="text-sm font-black text-orange-500">{rule.sound}</div>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{rule.desc}</p>

        <div className="mt-4 flex flex-col gap-2">
          {rule.words.map(rw => {
            const w = wordById(lookup(rw) ?? -1)
            return (
              <div key={rw} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <AudioBtn word={w?.en || rw} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-slate-800">
                    {rw} <span className="ml-1 text-xs font-bold text-slate-400">{w?.ipa || ''}</span>
                  </div>
                  <div className="truncate text-xs text-slate-400">{w ? w.ru : ''}</div>
                </div>
                {w && <AudioBtn word={w.en} size="sm" slow />}
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">🐢 — медленно, 🔊 — обычная скорость</p>
      </div>
    </div>
  )
}
