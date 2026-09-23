import React from 'react'
import { ACHIEVEMENTS } from '../lib/gamification'
import { useStore } from '../lib/store'
import { Route } from '../App'

export default function Achievements({ go }: { go: (r: Route) => void }) {
  const unlocked = useStore(s => s.achievements)
  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => go('more')} className="h-10 w-10 rounded-full bg-white text-lg shadow active:bg-slate-50" aria-label="Назад">←</button>
        <div>
          <h1 className="text-xl font-black text-slate-800">🏆 Ачивки</h1>
          <p className="text-xs text-slate-400">Открыто: {unlocked.length} из {ACHIEVEMENTS.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map(a => {
          const open = unlocked.includes(a.id)
          return (
            <div key={a.id}
              className={`rounded-3xl p-4 text-center transition ${open ? 'bg-white shadow-[0_4px_24px_rgba(249,115,22,0.15)]' : 'bg-white/60 border-2 border-dashed border-slate-200'}`}>
              <div className={`text-4xl ${open ? '' : 'grayscale opacity-30'}`}>{a.emoji}</div>
              <div className={`mt-2 text-sm font-black ${open ? 'text-slate-800' : 'text-slate-400'}`}>{a.title}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-slate-400">{a.desc}</div>
              {open && <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-500">получено</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
