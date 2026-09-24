import React, { useEffect, useMemo, useState } from 'react'
import { WORDS, wordById, shuffle, sample } from '../lib/words'
import { useStore } from '../lib/store'
import { speak } from '../lib/tts'
import { Btn, Bar } from '../components/ui'
import { Route } from '../App'

interface Tile { key: string; wordId: number; label: string; kind: 'en' | 'ru' }

export default function PairsGame({ go }: { go: (r: Route) => void }) {
  const words = useStore(s => s.words)
  const addXp = useStore(s => s.addXp)
  const touchDay = useStore(s => s.touchDay)
  const bumpDaily = useStore(s => s.bumpDaily)

  const [round, setRound] = useState(1)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [flipped, setFlipped] = useState<string[]>([]) // ключи открытых (макс 2)
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)

  useEffect(() => { newRound(round) }, [round])

  function newRound(r: number) {
    const started = Object.entries(words).filter(([, w]) => w.box > 0).map(([id]) => Number(id))
    const pool = (started.length >= 6 ? shuffle(started).slice(0, 6) : [...shuffle(started), ...sample(shuffle(WORDS.map(w => w.id)), 6 - started.length)]).slice(0, 6)
    const ts: Tile[] = []
    for (const id of pool) {
      const w = wordById(id)!
      ts.push({ key: `en-${id}`, wordId: id, label: w.en, kind: 'en' })
      ts.push({ key: `ru-${id}`, wordId: id, label: w.ru.split(',')[0], kind: 'ru' })
    }
    setTiles(shuffle(ts))
    setFlipped([])
    setMatched([])
    setMoves(0)
  }

  function flip(t: Tile) {
    if (flipped.includes(t.key) || matched.includes(t.key) || flipped.length >= 2) return
    if (t.kind === 'en') speak(t.label)
    const nf = [...flipped, t.key]
    setFlipped(nf)
    if (nf.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = nf.map(k => tiles.find(x => x.key === k)!)
      if (a.wordId === b.wordId && a.kind !== b.kind) {
        setTimeout(() => {
          setMatched(m => {
            const nm = [...m, a.key, b.key]
            return nm
          })
          setFlipped([])
        }, 500)
      } else {
        setTimeout(() => setFlipped([]), 900)
      }
    }
  }

  // Раунд пройден
  useEffect(() => {
    if (tiles.length && matched.length === tiles.length) {
      const bonus = Math.max(1, 8 - moves) // чем меньше ходов, тем больше XP
      addXp(5 + bonus)
      bumpDaily('rev', true)
      touchDay()
    }
  }, [matched, tiles])

  const won = tiles.length > 0 && matched.length === tiles.length

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => go('train')} className="h-10 w-10 rounded-full bg-white text-lg shadow active:bg-slate-50" aria-label="Назад">←</button>
        <div className="flex-1">
          <div className="font-black text-slate-800">🧩 Найди пару — раунд {round}</div>
          <div className="text-xs text-slate-400">Ходов: {moves} · пар: {matched.length / 2}/{tiles.length / 2}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map(t => {
          const open = flipped.includes(t.key) || matched.includes(t.key)
          return (
            <button
              key={t.key}
              onClick={() => flip(t)}
              aria-label={open ? t.label : 'карточка'}
              className={`flex h-24 items-center justify-center rounded-2xl p-1 text-center transition-all duration-200 ${
                matched.includes(t.key)
                  ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-600'
                  : open
                    ? 'bg-orange-50 border-2 border-orange-400 text-slate-800 scale-105'
                    : 'bg-white border-2 border-slate-100 text-transparent shadow'
              }`}
            >
              <span className={`text-sm font-black leading-tight ${open ? '' : 'select-none'}`}>
                {open ? t.label : '❓'}
              </span>
            </button>
          )
        })}
      </div>

      {won && (
        <Card className="mt-5 anim-pop text-center">
          <div className="text-5xl">🎉</div>
          <div className="mt-1 text-lg font-black text-slate-800">Все пары найдены!</div>
          <div className="text-sm text-slate-400">Ходов: {moves} · +{Math.max(1, 8 - moves) + 5} XP</div>
          <Btn className="mt-3 h-12 w-full" onClick={() => setRound(r => r + 1)}>🔄 Ещё раунд</Btn>
          <Btn variant="soft" className="mt-2 h-11 w-full" onClick={() => go('train')}>К тренировкам</Btn>
        </Card>
      )}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-4 shadow-[0_4px_24px_rgba(249,115,22,0.10)] ${className}`}>{children}</div>
}
