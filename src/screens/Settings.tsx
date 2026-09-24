import React, { useRef, useState } from 'react'
import { useStore, downloadProgress, importProgressFile, todayStr } from '../lib/store'
import { cloudEnabled } from '../firebase/config'
import { syncState, restoreByCode, pushNow } from '../firebase/sync'
import { setTtsRate, speak } from '../lib/tts'
import { boxDistribution } from '../lib/srs'
import { levelInfo } from '../lib/gamification'
import { WORDS } from '../lib/words'
import { Btn, Card, Bar } from '../components/ui'
import { InstallCard } from '../components/InstallCard'
import { Route } from '../App'

/** Понятная расшифровка ошибок синхронизации */
function syncErrorText(e: string): string {
  if (/insufficient permissions|PERMISSION_DENIED/i.test(e))
    return 'нет доступа к базе: в Firebase Console → Firestore → Rules вставь разрешающие правила (шаблон — в README репозитория)'
  if (/permission-denied/i.test(e))
    return 'нет доступа к базе: проверь правила Firestore (шаблон — в README репозитория)'
  return e
}

export default function Settings({ go }: { go: (r: Route) => void }) {
  const s = useStore()
  const [restoreCode, setRestoreCode] = useState('')
  const [restoreMsg, setRestoreMsg] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dist = boxDistribution()
  const lvl = levelInfo(s.xp)
  const accuracy = s.answered ? Math.round((s.correct / s.answered) * 100) : 0
  const t = todayStr()
  const today = s.daily.date === t ? s.daily : { answers: 0, correct: 0 }

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => go('more')} className="h-10 w-10 rounded-full bg-white text-lg shadow active:bg-slate-50" aria-label="Назад">←</button>
        <h1 className="text-xl font-black text-slate-800">⚙️ Настройки и прогресс</h1>
      </div>

      {/* Цель дня */}
      <Card className="mb-3">
        <h2 className="font-black text-slate-800">🎯 Цель на день</h2>
        <Row label="Новых слов в день" value={s.settings.dailyNew} onChange={v => s.setSettings({ dailyNew: v })} min={3} max={15} step={1} />
        <Row label="Повторений в день" value={s.settings.dailyReviews} onChange={v => s.setSettings({ dailyReviews: v })} min={5} max={50} step={5} />
      </Card>

      {/* Скорость озвучки */}
      <Card className="mb-3">
        <h2 className="font-black text-slate-800">🔊 Скорость озвучки</h2>
        <input
          type="range" min={0.5} max={1.2} step={0.05} value={s.settings.ttsRate}
          onChange={e => { s.setTtsRate(Number(e.target.value)); setTtsRate(Number(e.target.value)) }}
          className="mt-2 w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>медленно</span>
          <button onClick={() => speak('Hello! How are you?')} className="font-bold text-orange-500 active:opacity-60">▶ попробовать</button>
          <span>быстро</span>
        </div>
      </Card>

      {/* Установка на телефон */}
      <InstallCard variant="settings" />

      {/* Облако */}
      <Card className="mb-3">
        <h2 className="font-black text-slate-800">☁️ Облако и код восстановления</h2>
        <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-center">
          <div className="text-xs font-bold text-slate-400">Твой код прогресса</div>
          <div className="text-2xl font-black tracking-[0.3em] text-orange-500">{s.deviceCode}</div>
          <p className="mt-1 text-[11px] text-slate-400">Запиши его! По коду прогресс восстанавливается на любом устройстве.</p>
        </div>
        {cloudEnabled ? (
          <>
            <p className="mt-2 text-xs text-slate-500">
              Статус: {syncState.status === 'ok' ? '✅ синхронизировано' : syncState.status === 'syncing' ? '⏳ синхронизация…' : syncState.status === 'error' ? `⚠️ ${syncErrorText(syncState.lastError)}` : '…'}
              {s.cloudSyncedAt && ` · ${new Date(s.cloudSyncedAt).toLocaleTimeString('ru-RU')}`}
            </p>
            <Btn variant="soft" className="mt-2 h-11 w-full" onClick={async () => { await pushNow(); setSyncMsg(syncState.status === 'ok' ? 'Сохранено в облако ✓' : `⚠️ ${syncErrorText(syncState.lastError)}`) }}>
              Сохранить сейчас
            </Btn>
            {syncMsg && <p className="mt-1 text-center text-xs font-bold text-emerald-600">{syncMsg}</p>}
          </>
        ) : (
          <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
            Облако ещё не подключено — прогресс хранится на телефоне. Код выше работает всегда: введи его на новом устройстве в поле ниже.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            value={restoreCode} onChange={e => setRestoreCode(e.target.value.toUpperCase())}
            placeholder="КОД" maxLength={8}
            className="h-11 flex-1 rounded-2xl border-2 border-slate-200 px-3 font-black tracking-widest outline-none focus:border-orange-400"
          />
          <Btn variant="soft" className="h-11" onClick={async () => {
            if (!restoreCode.trim()) return
            const ok = await restoreByCode(restoreCode)
            setRestoreMsg(ok ? 'Прогресс восстановлен! 🎉' : 'Код не найден 😕')
          }}>Восстановить</Btn>
        </div>
        {restoreMsg && <p className="mt-1 text-center text-xs font-bold text-emerald-600">{restoreMsg}</p>}
      </Card>

      {/* Резервная копия файлом */}
      <Card className="mb-3">
        <h2 className="font-black text-slate-800">💾 Резервная копия</h2>
        <div className="mt-2 flex gap-2">
          <Btn variant="soft" className="h-11 flex-1" onClick={downloadProgress}>Экспорт в файл</Btn>
          <Btn variant="soft" className="h-11 flex-1" onClick={() => fileRef.current?.click()}>Импорт из файла</Btn>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={async e => {
              const f = e.target.files?.[0]
              if (!f) return
              const ok = await importProgressFile(f)
              alert(ok ? 'Прогресс импортирован! ✓' : 'Файл не похож на резервную копию')
              e.target.value = ''
            }} />
        </div>
      </Card>

      {/* Для родителей */}
      <Card className="mb-3">
        <h2 className="font-black text-slate-800">📊 Для родителей</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <Stat label="Выучено слов" value={String(Object.values(s.words).filter(w => w.box >= 3).length)} />
          <Stat label="Точность ответов" value={`${accuracy}%`} />
          <Stat label="Серия дней" value={`${s.streak} 🔥`} />
          <Stat label="Уровень" value={`${lvl.emoji} ${lvl.title}`} />
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs font-bold text-slate-400">Ящики памяти (сколько слов на каждой ступени)</div>
          <div className="flex h-3 overflow-hidden rounded-full">
            {['bg-slate-200', 'bg-orange-300', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
              <div key={i} className={c} style={{ width: `${(dist[i] / WORDS.length) * 100}%` }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>новые</span><span>изучаются</span><span>почти выучены</span><span>выучены</span>
          </div>
        </div>

        <div className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-sm">
          <span className="text-slate-500">Сегодня: ответов {today.answers}</span>
          <span className="text-slate-500">верно {today.answers ? Math.round((today.correct / today.answers) * 100) : 0}%</span>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-center text-xs font-bold text-rose-400">Опасная зона: сбросить прогресс</summary>
          <Btn variant="danger" className="mt-2 h-11 w-full" onClick={() => {
            if (confirm('Точно сбросить ВЕСЬ прогресс? Это нельзя отменить.')) { s.resetAll(); alert('Прогресс сброшен') }
          }}>Сбросить весь прогресс</Btn>
        </details>
      </Card>
    </div>
  )
}

function Row({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - step))} className="h-9 w-9 rounded-full bg-slate-100 font-black text-slate-600 active:bg-slate-200">−</button>
        <span className="w-8 text-center text-lg font-black text-orange-500">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + step))} className="h-9 w-9 rounded-full bg-slate-100 font-black text-slate-600 active:bg-slate-200">+</button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-lg font-black text-slate-800">{value}</div>
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
    </div>
  )
}
