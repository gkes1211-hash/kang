import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';

// 설치형 버전은 글꼴을 함께 담고, 웹페이지 버전은 Google Fonts 에서 불러온다
if (import.meta.env.VITE_ARTIFACT !== '1') import('./styles/jua.css');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 앱 설치(바탕화면·홈 화면 아이콘)와 오프라인 실행을 위한 서비스 워커 (웹페이지 버전에서는 쓰지 않음)
if (import.meta.env.VITE_ARTIFACT !== '1' && import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
