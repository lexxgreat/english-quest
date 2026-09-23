import React, { useEffect } from 'react'
import { useStore, todayStr, learnedCount, dueWords } from '../lib/store'
import { levelInfo } from '../lib/gamification'
import { WORDS, LEVELS, wordById } from '../lib/words'
import { Card, Bar, Chip, Btn, AudioBtn } from '../components/ui'
import { Route } from '../App'

export default function Home({ go }: { go: (r: Route) => void }) {
  const { xp, streak, words, daily, settings, storiesRead, touchDay } = useStore()
  const lvl = levelInfo(xp)
  const learned = learnedCount(words)
  const due = dueWords(words).length

  useEffect(() => {
    useStore.getState().ensureToday()
    touchDay()
  }, [])

  const t = todayStr()
  const today = daily.date === t ? daily : { newDone: 0, revDone: 0, answers: 0, correct: 0, date: t }
  const newGoal = settings.dailyNew
  const revGoal = settings.dailyReviews
  const lessonDone = today.newDone >= newGoal && today.revDone >= Math.min(revGoal, Math.max(1, due))
  const totalGoal = newGoal + revGoal
  const done = Math.min(1, (today.newDone + today.revDone) / totalGoal)

  // Слово дня — детерминировано по дате
  const dayIdx = (Number(t.replace(/-/g, '')) % WORDS.length)
  const wotd = wordById(dayIdx + 1)!

  return (
    <div className="px-4 pt-6">
      {/* Шапка */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl anim-bounce">{lvl.emoji}</span>
          <div>
            <div className="text-sm font-black text-slate-800">Уровень {lvl.level} · {lvl.title}</div>
            <div className="text-xs text-slate-400">{xp} XP{lvl.next ? ` · до «${lvl.next.title}» ${lvl.next.xp - xp} XP` : ''}</div>
          </div>
        </div>
        <Chip className="bg-amber-100 text-amber-600">🔥 {streak} дн.</Chip>
      </div>

      {/* Цель дня */}
      <Card className="mb-4 !p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h1 className="text-lg font-black text-slate-800">Цель на сегодня</h1>
          <span className="text-sm font-bold text-slate-400">
            {today.newDone + today.revDone}/{totalGoal}
          </span>
        </div>
        <Bar value={done} />
        <div className="mt-2 flex gap-2 text-xs font-bold">
          <span className={today.newDone >= newGoal ? 'text-emerald-500' : 'text-slate-400'}>
            🌱 новые: {today.newDone}/{newGoal}
          </span>
          <span className="text-slate-300">·</span>
          <span className={today.revDone >= revGoal ? 'text-emerald-500' : 'text-slate-400'}>
            🔁 повторения: {today.revDone}/{revGoal}
          </span>
        </div>

        <Btn className="mt-4 h-14 w-full text-lg" onClick={() => go('lesson')}>
          {lessonDone ? '💪 Ещё потренироваться' : '🚀 Начать урок'}
        </Btn>
        {due > 0 && (
          <p className="mt-2 text-center text-xs font-bold text-orange-400">
            Пора повторить {due} {plural(due, ['слово', 'слова', 'слов'])}
          </p>
        )}
      </Card>

      {/* Слово дня */}
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <AudioBtn word={wotd.en} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-orange-400">Слово дня</div>
            <div className="truncate text-xl font-black text-slate-800">{wotd.en}</div>
            <div className="truncate text-sm text-slate-500">{wotd.ru} · {wotd.ipa}</div>
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-semibold text-slate-600">
          {wotd.ex[0].en} — <span className="text-slate-400">{wotd.ex[0].ru}</span>
        </p>
      </Card>

      {/* Быстрые кнопки */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button onClick={() => go('pairs')} className="rounded-3xl bg-white p-4 text-left shadow-[0_4px_24px_rgba(249,115,22,0.10)] active:scale-95 transition">
          <span className="text-2xl">🧩</span>
          <div className="mt-1 font-black text-slate-800">Найди пару</div>
          <div className="text-xs text-slate-400">Игра на память</div>
        </button>
        <button onClick={() => go('rules')} className="rounded-3xl bg-white p-4 text-left shadow-[0_4px_24px_rgba(249,115,22,0.10)] active:scale-95 transition">
          <span className="text-2xl">🔤</span>
          <div className="mt-1 font-black text-slate-800">Читать правильно</div>
          <div className="text-xs text-slate-400">Правила чтения</div>
        </button>
      </div>

      {/* Прогресс базы */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-800">Мой словарный запас</h2>
          <span className="text-sm font-black text-orange-500">{learned} / {WORDS.length}</span>
        </div>
        <Bar className="mt-2" value={learned / WORDS.length} />
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {LEVELS.map(L => {
            const total = WORDS.filter(w => w.level === L.n).length
            const doneL = Object.entries(words).filter(([id, p]) => wordById(Number(id))?.level === L.n && p.box >= 3).length
            return (
              <button key={L.n} onClick={() => go('words')} className="rounded-2xl bg-slate-50 px-1 py-2 text-center active:bg-orange-50">
                <div className="text-lg">{L.emoji}</div>
                <div className="text-[10px] font-bold text-slate-400">ур. {L.n}</div>
                <div className="text-[10px] font-black text-orange-500">{doneL}/{total}</div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Истории */}
      <button onClick={() => go('stories')} className="mb-4 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-left text-white shadow-lg shadow-emerald-200 active:scale-[0.98] transition">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide opacity-80">Изюминка</div>
            <div className="text-lg font-black">📖 Читай истории из своих слов</div>
            <div className="text-xs opacity-80">Прочитано: {storiesRead.length} из 12</div>
          </div>
          <span className="text-3xl">→</span>
        </div>
      </button>
    </div>
  )
}

function plural(n: number, forms: string[]): string {
  const n10 = n % 10, n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}
