import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { offlineState, onOfflineChange } from '../offline/sw';
import { useProgress } from './state';
import { ReaderBar } from './reader/ReaderBar';
import { ReaderProvider } from './reader/ReaderProvider';
import { Dashboard } from './pages/Dashboard';
import { Icon } from './Icon';

const TopicPage = lazy(() => import('./pages/TopicPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const FormulasPage = lazy(() => import('./pages/FormulasPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

/** Applies theme, text size, focus and motion settings to <html>. */
function useAppearance() {
  const { data } = useProgress();
  const s = data.settings;
  useEffect(() => {
    const h = document.documentElement;
    h.classList.remove('theme-slate', 'theme-chalk', 'theme-paper');
    h.classList.add(`theme-${s.theme}`);
    h.style.setProperty('--text-scale', String(s.textScale));
    h.classList.toggle('reduce-motion', s.reducedMotion === 'on');
    h.classList.toggle('focus-mode', s.focus);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', getComputedStyle(h).getPropertyValue('--bg').trim() || '#1e2a28');
  }, [s.theme, s.textScale, s.reducedMotion, s.focus]);
}

function OfflinePill() {
  const [, force] = useState(0);
  useEffect(() => onOfflineChange(() => force((n) => n + 1)), []);
  if (offlineState.online) return null;
  return (
    <div className="offline-pill" role="status" data-testid="offline-pill">
      Offline
    </div>
  );
}

function Rail() {
  const nav = (to: string, icon: Parameters<typeof Icon>[0]['name'], label: string, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => `nav${isActive ? ' active' : ''}`}>
      <Icon name={icon} />
      <span>{label}</span>
    </NavLink>
  );
  return (
    <nav className="rail" aria-label="Main">
      <NavLink to="/" className="logo" aria-label="Math Lab home">
        ∂x
      </NavLink>
      {nav('/', 'map', 'Learn', true)}
      {nav('/map', 'graph', 'Prereqs')}
      {nav('/review', 'review', 'Review')}
      {nav('/compare', 'compare', 'Compare')}
      {nav('/formulas', 'formula', 'Formulas')}
      {nav('/glossary', 'book', 'Glossary')}
      <span className="spacer" />
      {nav('/settings', 'settings', 'Settings')}
    </nav>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  useAppearance();
  const { data } = useProgress();
  return (
    <div className={`app${data.settings.focus ? ' focus' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Rail />
      <main className="main" id="main" tabIndex={-1}>
        <Suspense fallback={<p className="faint">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/topic/:id" element={<TopicPage />} />
            <Route path="/topic/:id/:step" element={<TopicPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/compare/:course" element={<ComparePage />} />
            <Route path="/formulas" element={<FormulasPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<p>Page not found.</p>} />
          </Routes>
        </Suspense>
      </main>
      <ReaderBar />
      <OfflinePill />
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter id="chalky">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
        </filter>
      </svg>
      <ScrollTop />
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <ReaderProvider>
        <Shell />
      </ReaderProvider>
    </HashRouter>
  );
}

/** Render children into the reader bar's right-hand slot (Back / Next). */
export function BarPortal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setEl(document.getElementById('bar-slot'));
  }, []);
  return el ? createPortal(children, el) : null;
}
