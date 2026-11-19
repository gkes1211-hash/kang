import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 미리보기 링크(claude.ai) 안에서는 주소 대신 메모리로 화면 이동 */}
    {import.meta.env.VITE_PREVIEW ? (
      <MemoryRouter><App /></MemoryRouter>
    ) : (
      <HashRouter><App /></HashRouter>
    )}
  </React.StrictMode>,
);
