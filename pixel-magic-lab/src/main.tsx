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
