import React, { useEffect, useMemo, useState } from 'react'
import { useStore, todayStr, learnedCount, dueWords } from '../lib/store'
import { levelInfo } from '../lib/gamification'
import { WORDS, LEVELS, wordById, Word } from '../lib/words'
import { ensurePlan, daySentences, DaySentence, wordOfTheDay } from '../lib/srs'
import { Card, Bar, Chip, Btn, AudioBtn, WordDetail, Sheet } from '../components/ui'
import { InstallCard } from '../components/InstallCard'
import { Route } from '../App'

export default function Home({ go }: { go: (r: Route) => void }) {
  const { xp, streak, words, daily, settings, storiesRead, touchDay, plan, pinnedToday } = useStore()
  const lvl = levelInfo(xp)
  const learned = learnedCount(words)
  const due = dueWords(words).length
  const [detail, setDetail] = useState<number | null>(null)
  const [wodPicker, setWodPicker] = useState(false)
  const [sents, setSents] = useState<DaySentence[]>([])
  const sentResults = useStore(s => s.dailySentences)

  useEffect(() => {
    useStore.getState().ensureToday()
    touchDay()
  }, [])

  // План на день: единый список для превью и урока; пересобирается при смене закреплений/настроек
  useEffect(() => {
    ensurePlan()
    setSents(daySentences())
  }, [pinnedToday, settings.dailyNew, settings.dailyReviews])

  const t = todayStr()
  const today = daily.date === t ? daily : { newDone: 0, revDone: 0, answers: 0, correct: 0, date: t }
  const newGoal = settings.dailyNew
  const revGoal = settings.dailyReviews
  const lessonDone = today.newDone >= newGoal && today.revDone >= Math.min(revGoal, Math.max(1, due))
  const totalGoal = newGoal + revGoal
  const done = Math.min(1, (today.newDone + today.revDone) / totalGoal)

  // Слово дня — из самых употребимых, либо закреплённое пользователем
  const wotd = wordOfTheDay()

  const todayPlan = plan && plan.date === t ? plan : null
  const planNew = (todayPlan?.newIds || []).filter(id => wordById(id))
  const planRev = (todayPlan?.revIds || []).filter(id => wordById(id) && !planNew.includes(id))
  const planCount = planNew.length + planRev.length

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

      {/* Предложение установить приложение (Chrome сам больше не предлагает) */}
      <InstallCard variant="banner" />

      {/* Слова на сегодня: сначала ознакомься, потом урок */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-800">📋 Слова на сегодня</h2>
          <button onClick={() => go('plan')} className="text-xs font-bold text-orange-500 active:opacity-60">
            план слов ›
          </button>
        </div>
        {planCount === 0 ? (
          <p className="mt-3 text-sm text-slate-400">На сегодня слов нет — молодец, всё выучено! 🎉</p>
        ) : (
          <>
            {planNew.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {planNew.map(id => <PlanRow key={`n${id}`} id={id} tag="new" onOpen={() => setDetail(id)} />)}
              </div>
            )}
            {planRev.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {planRev.map(id => <PlanRow key={`r${id}`} id={id} tag="rev" onOpen={() => setDetail(id)} />)}
              </div>
            )}
            <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-400">
              Послушай и посмотри слова до урока. После урока здесь появится, что усвоено ✅
            </p>
            {sents.length > 0 && (
              <div className="mt-3 rounded-2xl bg-orange-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wide text-orange-400">🏁 Итог дня — предложения наизусть</span>
                  <span className="text-xs font-bold text-slate-400">
                    {sents.filter(s => (sentResults || []).some(r => r.en === s.en && r.ok)).length}/{sents.length}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {sents.map(s => {
                    const done = (sentResults || []).some(r => r.en === s.en && r.ok)
                    return (
                      <div key={s.en} className="flex items-center gap-2.5 rounded-2xl bg-white p-2.5">
                        <AudioBtn word={s.en} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-700">{s.en}</span>
                          <span className="block truncate text-xs text-slate-400">{s.ru}</span>
                        </span>
                        <span className="shrink-0 text-sm" title={done ? 'Сдано' : 'Ещё не сдано'}>{done ? '✅' : '⬜'}</span>
                      </div>
                    )
                  })}
                </div>
                {(() => {
                  const allDone = sents.every(s => (sentResults || []).some(r => r.en === s.en && r.ok))
                  return allDone ? (
                    <p className="mt-2 text-center text-xs font-bold text-emerald-600">Предложения сданы — молодец! 🎉</p>
                  ) : (
                    <Btn variant="soft" className="mt-2 h-11 w-full" onClick={() => { window.location.hash = `/lesson?phase=summary&r=${Date.now()}` }}>
                      🎤 Продиктовать или написать
                    </Btn>
                  )
                })()}
              </div>
            )}
          </>
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
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2">
          <p className="min-w-0 flex-1 text-sm font-semibold text-slate-600">
            {wotd.ex[0].en} — <span className="text-slate-400">{wotd.ex[0].ru}</span>
          </p>
          <AudioBtn word={wotd.ex[0].en} size="sm" />
        </div>
        <button onClick={() => setWodPicker(true)} className="mt-2 w-full text-center text-xs font-bold text-orange-400 active:opacity-60">
          ✏️ выбрать своё слово дня
        </button>
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

      <WordDetail wordId={detail} onClose={() => setDetail(null)} />
      <WodPicker open={wodPicker} onClose={() => setWodPicker(false)} />
    </div>
  )
}

/* ---------- Строка «слов на сегодня» ---------- */

function PlanRow({ id, tag, onOpen }: { id: number; tag: 'new' | 'rev'; onOpen: () => void }) {
  const w = wordById(id)!
  const res = useStore(s => (s.dailyWordResults || {})[id])
  const learnedToday = (res?.ok || 0) > 0
  const failedToday = (res?.fail || 0) > 0 && !learnedToday
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-2.5 rounded-2xl bg-slate-50 p-2.5 text-left active:bg-orange-50">
      <AudioBtn word={w.en} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-sm font-black text-slate-800">{w.en}</span>
          <span className="truncate text-[11px] text-slate-400">{w.ipa}</span>
        </span>
        <span className="block truncate text-xs text-slate-400">{w.ru}</span>
      </span>
      {learnedToday && <span className="shrink-0 text-sm" title="Усвоено сегодня">✅</span>}
      {failedToday && <span className="shrink-0 text-sm" title="Была ошибка">⚠️</span>}
      <span className="shrink-0 text-[10px] font-bold text-slate-300">{tag === 'new' ? '🌱' : '🔁'}</span>
    </button>
  )
}

/* ---------- Выбор своего слова дня ---------- */

function WodPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const wodPin = useStore(s => s.wodPin)
  const setWod = useStore(s => s.setWod)
  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return WORDS.filter(w => !query || w.en.toLowerCase().includes(query) || w.ru.toLowerCase().includes(query)).slice(0, 60)
  }, [q])

  function pick(w: Word) {
    setWod(w.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="mb-1 pr-10 text-lg font-black text-slate-800">✏️ Слово дня</h2>
      <p className="mb-3 text-xs text-slate-400">Выбери любое слово из словаря — оно появится на главной.</p>
      <div className="mb-2 flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск слова…"
          className="h-11 flex-1 rounded-2xl border-2 border-slate-200 px-3 text-sm font-semibold outline-none focus:border-orange-400"
        />
        <Btn variant="soft" className="h-11" onClick={() => {
          const pool = WORDS.filter(w => w.level <= 2)
          pick(pool[Math.floor(Math.random() * pool.length)])
        }}>🎲</Btn>
      </div>
      {wodPin && (
        <button onClick={() => { setWod(null); onClose() }} className="mb-2 w-full rounded-2xl bg-slate-50 py-2 text-xs font-bold text-slate-500 active:bg-slate-100">
          ↩️ вернуть автоматическое слово дня
        </button>
      )}
      <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
        {list.map(w => (
          <button key={w.id} onClick={() => pick(w)}
            className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-left active:bg-orange-50 ${wodPin === w.id ? 'bg-orange-50' : 'bg-white'}`}>
            <span onClick={e => e.stopPropagation()}><AudioBtn word={w.en} size="sm" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-800">{w.en}</span>
              <span className="block truncate text-xs text-slate-400">{w.ru}</span>
            </span>
            {wodPin === w.id && <span className="text-xs font-bold text-orange-500">текущее</span>}
          </button>
        ))}
        {!list.length && <p className="py-6 text-center text-sm text-slate-400">Не нашлось 🤷</p>}
      </div>
    </Sheet>
  )
}

function plural(n: number, forms: string[]): string {
  const n10 = n % 10, n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}
