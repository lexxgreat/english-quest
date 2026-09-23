import React, { useEffect, useRef, useState } from 'react'
import { speak } from '../lib/tts'
import { wordById, Word } from '../lib/words'
import { useStore } from '../lib/store'
import { ACHIEVEMENTS } from '../lib/gamification'

/* ---------- Кнопки и базовые блоки ---------- */

export function Btn({ children, onClick, variant = 'primary', className = '', disabled }: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'ghost' | 'success' | 'soft' | 'danger'
  className?: string; disabled?: boolean
}) {
  const styles: Record<string, string> = {
    primary: 'bg-orange-500 text-white shadow-lg shadow-orange-200 active:bg-orange-600',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 active:bg-emerald-600',
    soft: 'bg-white text-slate-700 border-2 border-slate-200 active:bg-slate-50',
    ghost: 'bg-transparent text-slate-500 active:bg-slate-100',
    danger: 'bg-rose-500 text-white active:bg-rose-600',
  }
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl px-5 font-bold transition-all active:scale-95 disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(249,115,22,0.10)] p-4 ${className}`}>
      {children}
    </div>
  )
}

export function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${className}`}>{children}</span>
}

/* ---------- Озвучка ---------- */

export function AudioBtn({ word, size = 'md', slow = false }: { word: string; size?: 'sm' | 'md' | 'lg'; slow?: boolean }) {
  const [pulse, setPulse] = useState(false)
  const sizes = { sm: 'h-9 w-9 text-lg', md: 'h-12 w-12 text-2xl', lg: 'h-16 w-16 text-3xl' }
  return (
    <button
      aria-label={slow ? 'Прослушать медленно' : 'Прослушать'}
      onClick={() => { setPulse(true); speak(word, { slow }); setTimeout(() => setPulse(false), 500) }}
      className={`flex items-center justify-center rounded-full bg-orange-100 text-orange-600 active:bg-orange-200 active:scale-90 transition ${pulse ? 'ring-4 ring-orange-200' : ''} ${sizes[size]}`}
    >
      {slow ? '🐢' : '🔊'}
    </button>
  )
}

/* ---------- Полоса прогресса ---------- */

export function Bar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-orange-100 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  )
}

/* ---------- Нижний лист (модалка) ---------- */

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="anim-slide relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl safe-bottom max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Закрыть" className="absolute right-4 top-4 h-9 w-9 rounded-full bg-slate-100 text-slate-500 text-lg active:bg-slate-200">✕</button>
        {children}
      </div>
    </div>
  )
}

/* ---------- Тост ---------- */

export function Toast({ toast }: { toast: { text: string; id: number } | null }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(t)
  }, [toast?.id])
  if (!toast || !visible) return null
  return (
    <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="anim-pop rounded-2xl bg-slate-900/90 px-5 py-3 text-center text-sm font-bold text-white shadow-xl">
        {toast.text}
      </div>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null)
  const idRef = useRef(0)
  return {
    toast,
    show: (text: string) => setToast({ text, id: ++idRef.current }),
  }
}

/* ---------- Карточка слова ---------- */

export function WordDetail({ wordId, onClose }: { wordId: number | null; onClose: () => void }) {
  const resetWord = useStore(s => s.resetWord)
  const words = useStore(s => s.words)
  const w: Word | undefined = wordId != null ? wordById(wordId) : undefined
  if (!w) return null
  const p = words[w.id]
  return (
    <Sheet open={!!w} onClose={onClose}>
      <div className="flex items-center gap-3">
        <AudioBtn word={w.en} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-2xl font-black text-slate-800">{w.en}</div>
          <div className="text-sm text-slate-400">{w.ipa}</div>
        </div>
        <AudioBtn word={w.en} slow size="sm" />
      </div>
      <div className="mt-3 text-xl font-bold text-orange-600">{w.ru}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {w.levelName}
      </div>
      <div className="mt-4 rounded-2xl bg-orange-50 p-4">
        <div className="text-xs font-bold uppercase text-orange-400">Пример</div>
        {w.ex.map((e, i) => (
          <div key={i} className="mt-2">
            <div className="flex items-center gap-2">
              <p className="flex-1 font-semibold text-slate-700">{e.en}</p>
              <AudioBtn word={e.en} size="sm" />
            </div>
            <p className="text-sm text-slate-400">{e.ru}</p>
          </div>
        ))}
      </div>
      {p && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Ящик {p.box} · <span className="text-emerald-600">✓ {p.ok}</span> · <span className="text-rose-500">✗ {p.wrong}</span>
          </span>
          <button
            onClick={() => { if (confirm('Сбросить прогресс по этому слову?')) { resetWord(w.id); onClose() } }}
            className="font-bold text-rose-500 active:opacity-60"
          >
            Сбросить
          </button>
        </div>
      )}
    </Sheet>
  )
}

/* ---------- Уведомление об ачивке ---------- */

export function achievementToast(id: string): string {
  const a = ACHIEVEMENTS.find(x => x.id === id)
  return a ? `${a.emoji} Ачивка: «${a.title}»!` : '🎉 Новая ачивка!'
}
