import React, { useEffect, useMemo, useRef, useState } from 'react'
import { wordById, WORDS, shuffle, sample, normalize, Word } from '../lib/words'
import { speak } from '../lib/tts'
import { useStore } from '../lib/store'
import { buildDailyQueue, buildModeQueue, QueueItem, unseenIds } from '../lib/srs'
import { Btn, AudioBtn, Bar, Card, WordDetail } from '../components/ui'
import { Route } from '../App'

export type Mode = 'daily' | 'quiz_en_ru' | 'quiz_ru_en' | 'listen' | 'spell'

/** Режим передаётся через query строки: #/lesson?mode=listen */
function readMode(): Mode {
  const q = window.location.hash.split('?')[1] || ''
  const m = new URLSearchParams(q).get('mode')
  return (m as Mode) || 'daily'
}

export default function Lesson({ go }: { go: (r: Route) => void }) {
  const mode = readMode()
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    mode === 'daily' ? buildDailyQueue() : buildModeQueue(mode as Exclude<Mode, 'daily'>),
  )
  const [idx, setIdx] = useState(0)
  const [session, setSession] = useState({ started: Date.now(), correct: 0, wrong: 0, xp: 0 })
  const [detail, setDetail] = useState<number | null>(null)
  const [reviewIdx, setReviewIdx] = useState<number | null>(null) // просмотр предыдущих слов
  const againRef = useRef<number[]>([]) // слова для повторного показа в этой сессии

  const item = queue[idx]
  const finished = !item

  useEffect(() => { if (mode !== 'daily' && queue.length === 0) setIdx(0) }, [])

  function next(correct: boolean, isNew: boolean, boxBefore: number, bonusXp = 0) {
    const s = useStore.getState()
    const gained = s.answerWord(item.wordId, correct, isNew, boxBefore)
    s.touchDay()
    setSession(p => ({ ...p, correct: p.correct + (correct ? 1 : 0), wrong: p.wrong + (correct ? 0 : 1), xp: p.xp + gained + bonusXp }))
    if (!correct && !isNew) {
      // неверное слово вернётся в конце сессии (закрепление)
      againRef.current = [...againRef.current, item.wordId]
    }
    setReviewIdx(null)
    setIdx(i => i + 1)
  }

  if (finished) {
    return <Summary mode={mode} session={session} go={go} />
  }

  const w = wordById(item.wordId)!
  const store = useStore.getState()
  const wp = store.words[w.id]
  const isNew = item.isNew && !wp?.introduced
  const boxBefore = wp?.box ?? 0

  /** Открыть просмотр предыдущего слова (назад) */
  const openReview = () => { if (idx > 0) setReviewIdx(idx - 1) }
  const reviewWord = reviewIdx !== null ? wordById(queue[reviewIdx]?.wordId) : undefined

  return (
    <div className="px-4 pt-4">
      {/* Шапка сессии */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="h-10 w-10 rounded-full bg-white text-lg shadow active:bg-slate-50" aria-label="Выйти">✕</button>
        <Bar value={idx / Math.max(1, queue.length)} className="flex-1" />
        <span className="text-sm font-black text-slate-400">{idx + 1}/{queue.length}</span>
      </div>

      <div key={`${idx}-${item.kind}`} className="anim-pop">
        {item.kind === 'intro' && (
          <IntroCard w={w} onNext={() => next(true, isNew, boxBefore)} onReview={openReview} canReview={idx > 0} />
        )}
        {item.kind === 'quiz_en_ru' && (
          <Quiz w={w} dir="en_ru" onAdvance={(ok, bonus) => next(ok, isNew, boxBefore, bonus)} onReview={openReview} canReview={idx > 0} />
        )}
        {item.kind === 'quiz_ru_en' && (
          <Quiz w={w} dir="ru_en" onAdvance={(ok, bonus) => next(ok, isNew, boxBefore, bonus)} onReview={openReview} canReview={idx > 0} />
        )}
        {item.kind === 'listen' && (
          <Listen w={w} onAdvance={(ok, bonus) => next(ok, isNew, boxBefore, bonus)} onReview={openReview} canReview={idx > 0} />
        )}
        {item.kind === 'spell' && (
          <Spell w={w} onAdvance={(ok, bonus) => next(ok, isNew, boxBefore, bonus)} onReview={openReview} canReview={idx > 0} />
        )}
      </div>

      <button onClick={() => setDetail(w.id)} className="mx-auto mt-6 block text-sm font-bold text-slate-300 active:text-slate-500">
        что это слово значит? 🤔
      </button>
      <WordDetail wordId={detail} onClose={() => setDetail(null)} />

      {/* Оверлей повторения предыдущих слов */}
      {reviewWord && (
        <ReviewCard
          w={reviewWord}
          canPrev={reviewIdx! > 0}
          onPrev={() => setReviewIdx(i => (i !== null && i > 0 ? i - 1 : i))}
          onClose={() => setReviewIdx(null)}
        />
      )}
    </div>
  )
}

/* ============ Панель разбора после неверного ответа: ждём «Дальше» ============ */

function FeedbackPanel({ w, onAdvance, onReview, canReview }: {
  w: Word; onAdvance: () => void; onReview: () => void; canReview: boolean
}) {
  return (
    <div className="mt-4 anim-pop">
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <AudioBtn word={w.en} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-black text-slate-800">{w.en}</div>
            <div className="truncate text-xs text-slate-400">{w.ipa} · {w.ru}</div>
          </div>
          <AudioBtn word={w.en} size="sm" slow />
        </div>
        <div className="mt-3 rounded-2xl bg-orange-50 p-3">
          {w.ex.map((e, i) => (
            <div key={i} className={i ? 'mt-2' : ''}>
              <div className="flex items-center gap-2">
                <p className="flex-1 font-semibold text-slate-700">{e.en}</p>
                <AudioBtn word={e.en} size="sm" />
              </div>
              <p className="text-sm text-slate-400">{e.ru}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-3 flex gap-2.5">
        {canReview && <Btn variant="soft" className="h-14 flex-1 text-lg" onClick={onReview}>← Назад</Btn>}
        <Btn className={`h-14 text-lg ${canReview ? 'flex-[2]' : 'w-full'}`} onClick={onAdvance}>Дальше →</Btn>
      </div>
    </div>
  )
}

/* ============ Оверлей повторения предыдущего слова ============ */

function ReviewCard({ w, onClose, onPrev, canPrev }: {
  w: Word; onClose: () => void; onPrev: () => void; canPrev: boolean
}) {
  useEffect(() => { const t = setTimeout(() => speak(w.en, { slow: true }), 250); return () => clearTimeout(t) }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="anim-slide relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl safe-bottom max-h-[80vh] overflow-y-auto">
        <div className="mb-1 text-center text-xs font-bold uppercase tracking-wide text-orange-400">Повторяем слово</div>
        <div className="flex items-center gap-3">
          <AudioBtn word={w.en} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-2xl font-black text-slate-800">{w.en}</div>
            <div className="text-sm text-slate-400">{w.ipa}</div>
          </div>
          <AudioBtn word={w.en} slow size="sm" />
        </div>
        <div className="mt-2 text-xl font-black text-orange-600">{w.ru}</div>
        <div className="mt-3 rounded-2xl bg-orange-50 p-4">
          {w.ex.map((e, i) => (
            <div key={i} className={i ? 'mt-2' : ''}>
              <div className="flex items-center gap-2">
                <p className="flex-1 font-semibold text-slate-700">{e.en}</p>
                <AudioBtn word={e.en} size="sm" />
              </div>
              <p className="text-sm text-slate-400">{e.ru}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2.5">
          {canPrev && <Btn variant="soft" className="h-12 flex-1" onClick={onPrev}>← Ещё назад</Btn>}
          <Btn className={`h-12 ${canPrev ? 'flex-[2]' : 'w-full'}`} onClick={onClose}>Дальше →</Btn>
        </div>
      </div>
    </div>
  )
}

/* ============ Знакомство со словом (сначала звук, потом текст) ============ */

function IntroCard({ w, onNext, onReview, canReview }: {
  w: ReturnType<typeof wordById>; onNext: () => void; onReview: () => void; canReview: boolean
}) {
  const [stage, setStage] = useState<0 | 1>(0)
  const word = w!

  useEffect(() => {
    // Сначала слово звучит — текст появляется потом (звук → текст)
    const t = setTimeout(() => speak(word.en, { slow: true }), 250)
    const t2 = setTimeout(() => setStage(1), 1400)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])

  return (
    <div>
      <p className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-orange-400">
        {stage === 0 ? 'Слушай…' : 'Новое слово!'}
      </p>
      <div className="flex justify-center"><span className="text-6xl">{stage === 0 ? '🔊' : '⭐'}</span></div>

      {stage === 1 && (
        <Card className="mt-4 anim-pop !p-6 text-center">
          <div className="text-4xl font-black text-slate-800">{word.en}</div>
          <div className="mt-1 text-slate-400">{word.ipa}</div>
          <div className="mt-3 text-2xl font-black text-orange-600">{word.ru}</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <AudioBtn word={word.en} size="md" />
            <AudioBtn word={word.en} size="md" slow />
          </div>
          <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-left">
            {word.ex.map((e, i) => (
              <div key={i} className={i ? 'mt-3' : ''}>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-semibold text-slate-700">{e.en}</p>
                  <AudioBtn word={e.en} size="sm" />
                </div>
                <p className="text-sm text-slate-400">{e.ru}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {canReview && stage === 1 && (
        <Btn variant="soft" className="mt-5 h-14 w-full text-lg" onClick={onReview}>← Повторить предыдущее</Btn>
      )}
      <Btn className="mt-3 h-14 w-full text-lg" onClick={onNext}>
        {stage === 0 ? 'Показать слово' : 'Понятно, дальше →'}
      </Btn>
    </div>
  )
}

/* ============ Квизы: выбор перевода ============ */

function Quiz({ w, dir, onAdvance, onReview, canReview }: {
  w: ReturnType<typeof wordById>; dir: 'en_ru' | 'ru_en'
  onAdvance: (ok: boolean, bonus?: number) => void; onReview: () => void; canReview: boolean
}) {
  const word = w!
  const [picked, setPicked] = useState<number | null>(null)
  const [awaitNext, setAwaitNext] = useState(false)
  const options = useMemo(() => {
    const distractIds = sample(WORDS.filter(x => x.id !== word.id), 3)
    return shuffle([word, ...distractIds])
  }, [word.id])
  const [hintAudio] = useState(() => dir === 'en_ru')

  useEffect(() => { if (hintAudio) speak(word.en) }, [])

  function pick(id: number) {
    if (picked !== null) return
    setPicked(id)
    const ok = id === word.id
    if (ok) {
      // правильно — сразу к следующему слову
      setTimeout(() => onAdvance(true, dir === 'en_ru' ? 0 : 1), 650)
    } else {
      // неправильно — разбираем слово и ждём кнопку «Дальше»
      speak(word.en)
      setAwaitNext(true)
    }
  }

  const done = picked !== null
  const wrong = done && picked !== word.id
  return (
    <div>
      <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-400">
        {dir === 'en_ru' ? 'Как переводится?' : 'Как по-английски?'}
      </p>
      <Card className="!p-6 text-center">
        {dir === 'en_ru' ? (
          <>
            <div className="text-4xl font-black text-slate-800">{word.en}</div>
            <div className="mt-1 text-sm text-slate-400">{word.ipa}</div>
            <div className="mt-3 flex justify-center"><AudioBtn word={word.en} size="md" /></div>
          </>
        ) : (
          <>
            <div className="text-3xl font-black text-orange-600">{word.ru}</div>
            <div className="mt-1 text-sm font-bold text-slate-400">{word.pos === 'v' ? 'глагол' : ''}</div>
          </>
        )}
      </Card>
      <div className="mt-4 grid grid-cols-1 gap-2.5">
        {options.map(o => {
          const isRight = o.id === word.id
          let cls = 'bg-white border-2 border-slate-100 text-slate-700'
          if (done && isRight) cls = 'bg-emerald-50 border-emerald-400 text-emerald-700'
          else if (done && picked === o.id) cls = 'bg-rose-50 border-rose-400 text-rose-600 anim-shake'
          else if (done) cls = 'bg-white border-slate-100 text-slate-400'
          return (
            <button key={o.id} onClick={() => pick(o.id)} disabled={done}
              className={`rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold transition active:scale-[0.98] ${cls}`}>
              {dir === 'en_ru' ? o.ru : o.en}
              {done && isRight && <span className="float-right">✓</span>}
              {done && picked === o.id && !isRight && <span className="float-right">✗</span>}
            </button>
          )
        })}
      </div>
      {done && !wrong && (
        <p className="mt-4 text-center text-sm font-semibold text-slate-500 anim-pop">🎉 Верно!</p>
      )}
      {wrong && awaitNext && (
        <FeedbackPanel
          w={word}
          canReview={canReview}
          onReview={onReview}
          onAdvance={() => onAdvance(false, dir === 'en_ru' ? 0 : 1)}
        />
      )}
    </div>
  )
}

/* ============ Аудирование: услышь → выбери ============ */

function Listen({ w, onAdvance, onReview, canReview }: {
  w: ReturnType<typeof wordById>
  onAdvance: (ok: boolean, bonus?: number) => void; onReview: () => void; canReview: boolean
}) {
  const word = w!
  const [picked, setPicked] = useState<number | null>(null)
  const [awaitNext, setAwaitNext] = useState(false)
  const options = useMemo(() => sample(WORDS.filter(x => x.id !== word.id && x.topic === word.topic), 2)
    .concat(sample(WORDS.filter(x => x.id !== word.id && x.topic !== word.topic), 1))
    .concat([word]).slice(0, 4), [word.id])
  const shuffled = useMemo(() => shuffle(options), [word.id])

  useEffect(() => {
    const t = setTimeout(() => speak(word.en, { slow: true }), 300)
    return () => clearTimeout(t)
  }, [])

  function pick(id: number) {
    if (picked !== null) return
    setPicked(id)
    const ok = id === word.id
    if (ok) setTimeout(() => onAdvance(true, 2), 650)
    else setAwaitNext(true)
  }

  const done = picked !== null
  const wrong = done && picked !== word.id
  return (
    <div>
      <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-400">👂 Услышь слово</p>
      <div className="flex flex-col items-center gap-3">
        <AudioBtn word={word.en} size="lg" />
        <AudioBtn word={word.en} size="sm" slow />
        <span className="text-xs text-slate-400">нажми, чтобы услышать снова</span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-2.5">
        {shuffled.map(o => {
          const isRight = o.id === word.id
          let cls = 'bg-white border-2 border-slate-100 text-slate-700'
          if (done && isRight) cls = 'bg-emerald-50 border-emerald-400 text-emerald-700'
          else if (done && picked === o.id) cls = 'bg-rose-50 border-rose-400 text-rose-600 anim-shake'
          else if (done) cls = 'bg-white border-slate-100 text-slate-400'
          return (
            <button key={o.id} onClick={() => pick(o.id)} disabled={done}
              className={`rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold transition ${cls}`}>
              {o.ru}
            </button>
          )
        })}
      </div>
      {done && !wrong && (
        <Card className="mt-4 anim-pop text-center">
          <div className="text-2xl font-black text-slate-800">{word.en}</div>
          <div className="text-xs text-slate-400">{word.ipa} · {word.ru}</div>
        </Card>
      )}
      {wrong && awaitNext && (
        <FeedbackPanel w={word} canReview={canReview} onReview={onReview} onAdvance={() => onAdvance(false, 2)} />
      )}
    </div>
  )
}

/* ============ Правописание: впиши слово ============ */

function Spell({ w, onAdvance, onReview, canReview }: {
  w: ReturnType<typeof wordById>
  onAdvance: (ok: boolean, bonus?: number) => void; onReview: () => void; canReview: boolean
}) {
  const word = w!
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState<null | boolean>(null)
  const [hintCount, setHintCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const masked = word.ex[0].en.replace(new RegExp(word.en, 'ig'), '____')

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300) }, [])

  function check() {
    if (!value.trim() || checked !== null) return
    const ok = normalize(value) === normalize(word.en)
    setChecked(ok)
    if (!ok) {
      speak(word.en)
      // неправильно — ждём кнопку «Дальше» (можно спокойно разобрать слово)
    } else {
      setTimeout(() => onAdvance(true, Math.max(0, 4 - hintCount)), 800)
    }
  }

  function hint() {
    const nextLen = Math.min(hintCount + 1, word.en.length)
    setHintCount(nextLen)
    setValue(word.en.slice(0, nextLen))
    inputRef.current?.focus()
  }

  const ok = checked === true
  const bad = checked === false
  return (
    <div>
      <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-400">✍️ Впиши по-английски</p>
      <Card className="!p-6 text-center">
        <div className="text-3xl font-black text-orange-600">{word.ru}</div>
        <p className="mt-2 text-sm text-slate-400">{masked}</p>
      </Card>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') check() }}
        placeholder="по-английски…"
        disabled={checked !== null}
        autoCapitalize="off" autoCorrect="off" spellCheck={false}
        className={`mt-4 h-14 w-full rounded-2xl border-2 px-4 text-xl font-bold outline-none transition ${
          ok ? 'border-emerald-400 bg-emerald-50' : bad ? 'border-rose-400 bg-rose-50 anim-shake' : 'border-slate-200 bg-white focus:border-orange-400'
        }`}
      />
      {bad && (
        <p className="mt-2 text-center text-sm font-bold text-rose-500 anim-pop">
          Правильно: {word.en} {word.ipa}
        </p>
      )}
      <div className="mt-4 flex gap-2.5">
        <Btn variant="soft" className="h-14 flex-1" onClick={hint} disabled={checked !== null}>💡 Подсказка</Btn>
        <Btn className="h-14 flex-[2] text-lg" onClick={check} disabled={checked !== null || !value.trim()}>Проверить</Btn>
      </div>
      {hintCount > 0 && checked === null && (
        <p className="mt-2 text-center text-xs text-slate-400">Открыто букв: {hintCount} из {word.en.length} · бонус уменьшается</p>
      )}
      {bad && (
        <FeedbackPanel w={word} canReview={canReview} onReview={onReview} onAdvance={() => onAdvance(false, 0)} />
      )}
    </div>
  )
}

/* ============ Итоги сессии ============ */

function Summary({ mode, session, go }: { mode: Mode; session: { correct: number; wrong: number; xp: number }; go: (r: Route) => void }) {
  const total = session.correct + session.wrong
  const acc = total ? session.correct / total : 0
  const words = useStore(s => s.words)
  const learned = Object.values(words).filter(w => w.box >= 3).length

  if (total === 0) {
    return (
      <div className="px-4 pt-16 text-center">
        <div className="text-7xl anim-bounce">🌴</div>
        <h1 className="mt-3 text-2xl font-black text-slate-800">Всё сделано!</h1>
        <p className="mt-1 text-slate-400">Сегодня новых слов не осталось. Заходи завтра — база пополнится повторениями!</p>
        <Btn className="mt-6 h-14 w-full text-lg" onClick={() => go('home')}>🏠 На главную</Btn>
      </div>
    )
  }

  return (
    <div className="px-4 pt-8">
      <div className="text-center">
        <div className="text-7xl anim-bounce">{acc >= 0.9 ? '🏆' : acc >= 0.7 ? '🎉' : '💪'}</div>
        <h1 className="mt-2 text-2xl font-black text-slate-800">
          {mode === 'daily' ? 'Урок пройден!' : 'Тренировка завершена!'}
        </h1>
        <p className="mt-1 text-slate-400">
          {acc >= 0.9 ? 'Блестящий результат!' : acc >= 0.7 ? 'Хорошая работа!' : 'Ошибка — это шаг к знанию!'}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Card className="!p-3"><div className="text-2xl font-black text-emerald-500">{session.correct}</div><div className="text-xs font-bold text-slate-400">верно</div></Card>
        <Card className="!p-3"><div className="text-2xl font-black text-rose-400">{session.wrong}</div><div className="text-xs font-bold text-slate-400">ошибок</div></Card>
        <Card className="!p-3"><div className="text-2xl font-black text-orange-500">+{session.xp}</div><div className="text-xs font-bold text-slate-400">XP</div></Card>
      </div>
      <Card className="mt-4">
        <div className="flex justify-between text-sm font-bold text-slate-500">
          <span>Словарный запас</span><span className="text-orange-500">{learned} / {WORDS.length}</span>
        </div>
        <Bar className="mt-2" value={learned / WORDS.length} />
      </Card>
      <div className="mt-6 flex flex-col gap-2.5">
        <Btn className="h-14 text-lg" onClick={() => go('home')}>🏠 На главную</Btn>
        <Btn variant="soft" className="h-12" onClick={() => { window.location.hash = '/lesson?mode=daily&r=' + Date.now() }}>
          🔁 Ещё урок
        </Btn>
      </div>
    </div>
  )
}
