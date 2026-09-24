import React, { useEffect, useState } from 'react'
import {
  canInstall, isStandalone, platform, promptInstall,
  onInstallChange, dismissInstallHint, installHintDismissed, Platform,
} from '../lib/install'
import { Btn, Card } from './ui'

/** Пошаговая ручная установка — когда системный диалог недоступен */
function ManualSteps({ p }: { p: Platform }) {
  const steps: string[] = p === 'ios'
    ? [
        'Внизу в Safari нажми кнопку «Поделиться» (квадрат со стрелкой вверх ↑)',
        'В списке выбери «На экран „Домой“»',
        'Нажми «Добавить» — ярлык появится на рабочем столе',
      ]
    : p === 'android'
      ? [
          'Открой меню браузера (⋮ справа вверху)',
          'Выбери «Установить приложение» или «Добавить на главный экран»',
          'Подтверди установку — ярлык появится на рабочем столе',
        ]
      : [
          'В адресной строке браузера нажми значок установки (⊕ или монитор со стрелкой)',
        ]
  return (
    <ol className="mt-3 space-y-2">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">{i + 1}</span>
          <span className="flex-1">{s}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Карточка «Установить приложение».
 * variant='banner'   — на главной, градиентная, можно скрыть на 5 дней;
 * variant='settings' — в настройках, белая, со статусом.
 */
export function InstallCard({ variant = 'banner' }: { variant?: 'banner' | 'settings' }) {
  const [, bump] = useState(0)
  const [installed, setInstalled] = useState(isStandalone())
  const [dismissed, setDismissed] = useState(installHintDismissed())
  const [manual, setManual] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => onInstallChange(() => {
    setInstalled(isStandalone())
    bump(x => x + 1)
  }), [])

  // Уже стоит как приложение — не мешаем
  if (installed) return null

  const p = platform()
  const hasPrompt = canInstall()

  async function tryInstall() {
    setBusy(true)
    const res = await promptInstall()
    setBusy(false)
    if (res === 'accepted') {
      setInstalled(true)
    } else if (res === 'dismissed') {
      setMsg('Хорошо, предложение останется здесь 😉')
    } else {
      // Событие ещё не прилетело (Chrome ждёт активности на сайте) — ручной путь
      setManual(true)
    }
  }

  if (variant === 'banner') {
    if (dismissed && !hasPrompt) return null
    return (
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white shadow-lg shadow-orange-200">
        <button
          onClick={() => { dismissInstallHint(); setDismissed(true) }}
          aria-label="Скрыть"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-xs active:bg-white/40"
        >✕</button>
        <div className="flex items-center gap-3 pr-8">
          <span className="text-3xl">📲</span>
          <div className="min-w-0">
            <div className="font-black">Установить приложение</div>
            <div className="text-xs opacity-90">Ярлык на телефоне · полный экран · работает офлайн</div>
          </div>
        </div>
        {manual ? (
          <ManualSteps p={p} />
        ) : (
          <Btn
            variant="soft"
            className="mt-3 h-11 w-full !shadow-none"
            disabled={busy}
            onClick={hasPrompt ? tryInstall : () => setManual(true)}
          >
            {hasPrompt ? '📲 Установить' : 'Как установить?'}
          </Btn>
        )}
        {msg && <p className="mt-2 text-center text-xs font-bold opacity-90">{msg}</p>}
      </div>
    )
  }

  // settings
  return (
    <Card className="mb-3">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-800">📲 Установка на телефон</h2>
        {hasPrompt && <span className="text-[10px] font-bold text-emerald-500">готово к установке</span>}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Установи как приложение: будет открываться с ярлыка, без адресной строки, и работать без интернета.
      </p>
      {manual ? (
        <ManualSteps p={p} />
      ) : (
        <Btn variant="soft" className="mt-3 h-11 w-full" disabled={busy} onClick={hasPrompt ? tryInstall : () => setManual(true)}>
          {hasPrompt ? '📲 Установить сейчас' : 'Как установить?'}
        </Btn>
      )}
      {msg && <p className="mt-2 text-center text-xs font-bold text-emerald-600">{msg}</p>}
      {p === 'ios' && !manual && (
        <p className="mt-2 text-center text-[11px] text-slate-400">На iPhone установка — через меню «Поделиться» в Safari.</p>
      )}
    </Card>
  )
}
