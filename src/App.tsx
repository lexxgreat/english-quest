import React, { useEffect, useState } from 'react'
import Home from './screens/Home'
import Train from './screens/Train'
import Lesson from './screens/Lesson'
import PairsGame from './screens/PairsGame'
import Stories from './screens/Stories'
import Words from './screens/Words'
import More from './screens/More'
import Plan from './screens/Plan'
import ReadingRules from './screens/ReadingRules'
import Achievements from './screens/Achievements'
import Settings from './screens/Settings'
import { Toast, useToast, achievementToast } from './components/ui'
import { evaluateAchievements, ACHIEVEMENTS } from './lib/gamification'
import { useStore } from './lib/store'
import { setTtsRate } from './lib/tts'

export type Route =
  | 'home' | 'train' | 'lesson' | 'pairs' | 'stories'
  | 'words' | 'more' | 'plan' | 'rules' | 'ach' | 'settings'

const TAB_ROUTES: Route[] = ['home', 'train', 'stories', 'words', 'more']

function currentRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Route
  return h || 'home'
}

const NAV: { route: Route; icon: string; label: string }[] = [
  { route: 'home', icon: '🏠', label: 'Главная' },
  { route: 'train', icon: '🎯', label: 'Учить' },
  { route: 'stories', icon: '📖', label: 'Истории' },
  { route: 'words', icon: '📚', label: 'Слова' },
  { route: 'more', icon: '⚙️', label: 'Ещё' },
]

export default function App() {
  const [route, setRoute] = useState<Route>(currentRoute())
  const { toast, show } = useToast()
  const settings = useStore(s => s.settings)

  useEffect(() => {
    setTtsRate(settings.ttsRate)
  }, [settings.ttsRate])

  useEffect(() => {
    const onHash = () => { setRoute(currentRoute()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Проверка ачивок при любом изменении прогресса
  useEffect(() => {
    let prev = useStore.getState().updatedAt
    const unsub = useStore.subscribe((s) => {
      if (s.updatedAt !== prev) {
        prev = s.updatedAt
        const fresh = evaluateAchievements()
        if (fresh.length) {
          const a = ACHIEVEMENTS.find(x => x.id === fresh[0])
          show(a ? achievementToast(a.id) : '🎉 Новая ачивка!')
        }
      }
    })
    return unsub
  }, [])

  const go = (r: Route) => { window.location.hash = `/${r}` }
  const showNav = TAB_ROUTES.includes(route)

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <Toast toast={toast} />
      <main className={`flex-1 ${showNav ? 'pb-28' : 'pb-8'}`}>
        {route === 'home' && <Home go={go} />}
        {route === 'train' && <Train go={go} />}
        {route === 'lesson' && <Lesson key={window.location.hash} go={go} />}
        {route === 'pairs' && <PairsGame go={go} />}
        {route === 'stories' && <Stories go={go} />}
        {route === 'words' && <Words />}
        {route === 'more' && <More go={go} />}
        {route === 'plan' && <Plan go={go} />}
        {route === 'rules' && <ReadingRules go={go} />}
        {route === 'ach' && <Achievements go={go} />}
        {route === 'settings' && <Settings go={go} />}
      </main>

      {showNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-3 safe-bottom" aria-label="Навигация">
          <div className="flex items-stretch justify-around rounded-3xl bg-white/95 py-2 shadow-[0_-2px_24px_rgba(0,0,0,0.08)] backdrop-blur">
            {NAV.map(n => (
              <button
                key={n.route}
                onClick={() => go(n.route)}
                aria-current={route === n.route ? 'page' : undefined}
                className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-bold transition ${
                  route === n.route ? 'bg-orange-100 text-orange-600' : 'text-slate-400'
                }`}
              >
                <span className="text-xl leading-none">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
