import React, { useMemo, useState } from 'react'
import { STORIES, Story, STORY_EXT } from '../data/stories'
import { wordById, splitSentence, isServiceWord, WORDS, normalize } from '../lib/words'
import { useStore } from '../lib/store'
import { speak } from '../lib/tts'
import { AudioBtn, Sheet, Btn } from '../components/ui'
import { Route } from '../App'

type WordStatus = 'known' | 'learning' | 'new' | 'service' | 'ext'

export default function Stories({ go }: { go: (r: Route) => void }) {
  const storiesRead = useStore(s => s.storiesRead)
  const [openStory, setOpenStory] = useState<Story | null>(null)

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-black text-slate-800">📖 Микро-истории</h1>
      <p className="mb-1 text-sm text-slate-400">Составлены только из слов твоей базы. Нажимай на любые слова!</p>
      <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
        💡 Читаешь историю — и видишь, как слова работают в настоящем тексте. Зелёные слова ты уже знаешь, оранжевые — учишь, серые — новые (тапни их!).
      </div>

      <div className="flex flex-col gap-3">
        {STORIES.map(s => {
          const read = storiesRead.includes(s.id)
          const coverage = storyCoverage(s).coverage
          return (
            <button key={s.id} onClick={() => setOpenStory(s)}
              className="flex items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_4px_24px_rgba(249,115,22,0.10)] active:scale-[0.98] transition">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">{s.emoji}</span>
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-800">{s.title}</span>
                  {read && <span className="text-xs">✅</span>}
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${Math.round(coverage * 100)}%` }} />
                  </span>
                  <span className="text-xs font-bold text-slate-400">знаешь {Math.round(coverage * 100)}%</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {openStory && <StoryReader story={openStory} onClose={() => setOpenStory(null)} go={go} />}
    </div>
  )
}

function storyCoverage(s: Story) {
  const words = useStore.getState().words
  const knownSet = new Set(Object.entries(words).filter(([, p]) => p.box >= 3).map(([id]) => Number(id)))
  let known = 0, total = 0
  for (const line of s.lines) {
    for (const t of splitSentence(line.en)) {
      if (!t.isWord) continue
      total++
      if (isServiceWord(t.clean) || STORY_EXT[t.clean]) { known++; continue }
      const id = lookupWord(t.clean)
      if (id != null && knownSet.has(id)) known++
    }
  }
  return { coverage: total ? known / total : 0 }
}

function lookupWord(clean: string): number | null {
  const c = normalize(clean)
  if (!c) return null
  for (const w of WORDS) if (normalize(w.en) === c) return w.id
  if (c.endsWith('s')) {
    const sing = c.slice(0, -1)
    for (const w of WORDS) if (normalize(w.en) === sing) return w.id
  }
  return null
}

/* ================== Читалка ================== */

function StoryReader({ story, onClose, go }: { story: Story; onClose: () => void; go: (r: Route) => void }) {
  const words = useStore(s => s.words)
  const markStoryRead = useStore(s => s.markStoryRead)
  const addXp = useStore(s => s.addXp)
  const [finished, setFinished] = useState(false)
  const [tapWord, setTapWord] = useState<string | null>(null)

  const knownSet = useMemo(
    () => new Set(Object.entries(words).filter(([, p]) => p.box >= 3).map(([id]) => Number(id))),
    [words],
  )
  const learningSet = useMemo(
    () => new Set(Object.entries(words).filter(([, p]) => p.box > 0 && p.box < 3).map(([id]) => Number(id))),
    [words],
  )

  function statusOf(clean: string): WordStatus {
    if (!clean) return 'new'
    if (isServiceWord(clean)) return 'service'
    if (STORY_EXT[clean]) return 'ext'
    const id = lookupWord(clean)
    if (id == null) return 'new'
    if (knownSet.has(id)) return 'known'
    if (learningSet.has(id)) return 'learning'
    return 'new'
  }

  const cls: Record<WordStatus, string> = {
    known: 'text-emerald-600 font-bold',
    learning: 'text-orange-500 font-bold underline decoration-orange-300 decoration-wavy',
    new: 'text-slate-400 underline decoration-slate-300 decoration-dotted',
    service: 'text-slate-700',
    ext: 'text-slate-500 underline decoration-slate-200 decoration-dotted',
  }

  function finish() {
    const already = useStore.getState().storiesRead.includes(story.id)
    markStoryRead(story.id)
    if (!already) addXp(10)
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="anim-slide relative w-full max-w-md rounded-t-3xl bg-white p-6 pb-10 text-center shadow-2xl safe-bottom">
          <div className="text-6xl anim-bounce">🎉</div>
          <h2 className="mt-2 text-xl font-black text-slate-800">История прочитана!</h2>
          <p className="mt-1 text-sm text-slate-400">+10 XP за чтение. Каждый день — новая история.</p>
          <Btn className="mt-5 h-13 w-full" onClick={onClose}>Отлично!</Btn>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-white overflow-y-auto">
      <div className="w-full max-w-md px-4 py-5 safe-top safe-bottom">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 text-lg active:bg-slate-200" aria-label="Закрыть">✕</button>
          <div className="flex-1">
            <div className="font-black text-slate-800">{story.emoji} {story.title}</div>
            <div className="text-xs text-slate-400">Уровень {story.minLevel} · тапай слова 👆</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {story.lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 rounded-2xl bg-orange-50 px-4 py-3">
                <p className="text-lg font-semibold leading-snug">
                  {splitSentence(line.en).map((t, j) => {
                    if (!t.isWord) return <span key={j}>{t.token}</span>
                    const st = statusOf(t.clean)
                    return (
                      <span
                        key={j}
                        onClick={() => { setTapWord(t.clean); speak(t.clean.replace(/[^a-zA-Z' ]/g, '')) }}
                        className={`cursor-pointer active:opacity-60 ${cls[st]}`}
                      >
                        {t.token}{' '}
                      </span>
                    )
                  })}
                </p>
                <p className="mt-1 text-sm text-slate-400">{line.ru}</p>
              </div>
              <button
                onClick={() => speak(line.en)}
                aria-label="Прослушать предложение"
                className="mt-2 h-9 w-9 shrink-0 rounded-full bg-white text-orange-500 shadow active:bg-orange-50"
              >
                🔊
              </button>
            </div>
          ))}
        </div>

        <Btn className="mt-5 h-14 w-full text-lg" onClick={finish}>✅ Я прочитал!</Btn>
        {tapWord && <WordPopup word={tapWord} onClose={() => setTapWord(null)} go={go} />}
      </div>
    </div>
  )
}

/* Попап по тапнутому слову: озвучка + перевод + ссылка на карточку */
function WordPopup({ word, onClose, go }: { word: string; onClose: () => void; go: (r: Route) => void }) {
  const id = lookupWord(word)
  const w = id != null ? wordById(id) : null
  const ext = STORY_EXT[word]
  return (
    <Sheet open={!!word} onClose={onClose}>
      {w ? (
        <>
          <div className="flex items-center gap-3">
            <AudioBtn word={w.en} size="lg" />
            <div>
              <div className="text-2xl font-black text-slate-800">{w.en}</div>
              <div className="text-sm text-slate-400">{w.ipa}</div>
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-orange-600">{w.ru}</div>
          <div className="mt-3 rounded-2xl bg-orange-50 p-4">
            <p className="font-semibold text-slate-700">{w.ex[0].en}</p>
            <p className="text-sm text-slate-400">{w.ex[0].ru}</p>
          </div>
          <Btn variant="soft" className="mt-4 h-12 w-full" onClick={() => { onClose(); go('words') }}>
            📚 Открыть в словаре
          </Btn>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <AudioBtn word={word.replace(/[^a-zA-Z' ]/g, '')} size="lg" />
            <div className="text-2xl font-black text-slate-800">{word}</div>
          </div>
          <div className="mt-3 text-lg font-bold text-slate-600">{ext || 'Это служебное слово'}</div>
          <p className="mt-1 text-sm text-slate-400">{ext ? 'Оно встречается в историях — послушай, как звучит!' : 'Такие слова обычно учат прямо в фразах.'}</p>
        </>
      )}
    </Sheet>
  )
}
