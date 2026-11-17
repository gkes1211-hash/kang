import type { CSSProperties } from 'react';

/** 한 가지 선 스타일로 그린 아이콘 모음 (둥근 끝, 2.4 두께) */
const PATHS: Record<string, JSX.Element> = {
  up: <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />,
  down: <path d="M12 5v14M5.5 12.5 12 19l6.5-6.5" />,
  left: <path d="M19 12H5M11.5 5.5 5 12l6.5 6.5" />,
  right: <path d="M5 12h14M12.5 5.5 19 12l-6.5 6.5" />,
  brush: (
    <>
      <path d="M14.5 4.5 19.5 9.5 11 18l-5-5z" />
      <path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3.5.5 5.5-1.5c1.2-1.2 1-3.3 1-3.3" />
    </>
  ),
  eraser: (
    <>
      <path d="M8.5 19 3.8 14.3a1.6 1.6 0 0 1 0-2.3l7.7-7.7a1.6 1.6 0 0 1 2.3 0l5.9 5.9a1.6 1.6 0 0 1 0 2.3L13 19z" />
      <path d="M8.5 19H20M7 9.5l7.5 7.5" />
    </>
  ),
  drop: <path d="M12 3.5s6 6.4 6 10.8A6 6 0 0 1 6 14.3C6 9.9 12 3.5 12 3.5z" />,
  loop: (
    <>
      <path d="M4 12a7 7 0 0 1 12-4.9L18 9" />
      <path d="M18 4v5h-5" />
      <path d="M20 12a7 7 0 0 1-12 4.9L6 15" />
      <path d="M6 20v-5h5" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  pause: (
    <>
      <path d="M8.5 6v12M15.5 6v12" />
    </>
  ),
  step: (
    <>
      <path d="M6 6v12l8-6z" fill="currentColor" />
      <path d="M18 6v12" />
    </>
  ),
  restart: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4 4.5v4.5h4.5" />
    </>
  ),
  broom: (
    <>
      <path d="M14 3 10.5 11" />
      <path d="M7 11h8.5l2 9.5H5z" />
      <path d="M9.5 15.5 9 20.5M13.5 15.5l.5 5" />
    </>
  ),
  star: <path d="m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3.5 3.5V19a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M8 4v5h7V4M8 20v-6h8v6" />
    </>
  ),
  folder: <path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4.3l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" />,
  download: (
    <>
      <path d="M12 4v11M7 10.5l5 5 5-5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4.5 9.5 9 5" />
      <path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3" />
    </>
  ),
  redo: (
    <>
      <path d="m15 14 4.5-4.5L15 5" />
      <path d="M19.5 9.5H10a5.5 5.5 0 0 0 0 11h3" />
    </>
  ),
  sound: (
    <>
      <path d="M4.5 9.5h3.5L13 5v14l-5-4.5H4.5z" />
      <path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4.5 9.5h3.5L13 5v14l-5-4.5H4.5z" />
      <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
    </>
  ),
  fullscreen: <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />,
  bulb: (
    <>
      <path d="M9 17.5h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </>
  ),
  map: (
    <>
      <path d="m3.5 6 5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.7" />
      <circle cx="12" cy="17" r=".6" fill="currentColor" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="7" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  chevUp: <path d="m6.5 14.5 5.5-5.5 5.5 5.5" />,
  chevDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  chevLeft: <path d="M14.5 6.5 9 12l5.5 5.5" />,
  chevRight: <path d="M9.5 6.5 15 12l-5.5 5.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  film: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4" />
    </>
  ),
  wand: (
    <>
      <path d="m4 20 10.5-10.5" />
      <path d="m15.5 4.5.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6zM19 10l.4 1.1 1.1.4-1.1.4L19 13l-.4-1.1-1.1-.4 1.1-.4z" fill="currentColor" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 1.8-1 1.3-2-.6-1.2.2-2.5 1.6-2.5h1.8a3.8 3.8 0 0 0 3.8-3.8C20.5 7.2 16.7 3.5 12 3.5z" />
      <circle cx="8" cy="11" r="1.2" fill="currentColor" />
      <circle cx="11" cy="7.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  layers: (
    <>
      <path d="m12 4 8.5 4.5L12 13 3.5 8.5z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </>
  ),
  pointer: (
    <>
      <path d="M6 3.5 18.5 12l-5.6 1.2 3.2 6.1-2.4 1.2-3.2-6.1L6 18z" />
    </>
  ),
  code: <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />,
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 0 4 21z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 1 20 21z" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="m4 17.5 5-5 3.5 3.5 2.5-2.5 5 4.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  turtle: (
    <>
      <path d="M5 15.5a7 5.5 0 0 1 14 0z" />
      <path d="M19 15.5h1.5a2 2 0 0 0 0-4H19M7 15.5v2.5M16 15.5v2.5" />
    </>
  ),
  rabbit: (
    <>
      <path d="M9 9.5c-1.2-2.6-1.5-5.5-.3-5.9 1.2-.4 2.4 2.4 2.8 5.4M13 9c.4-3 1.6-5.8 2.8-5.4 1.2.4.9 3.3-.3 5.9" />
      <path d="M6.5 15a5.5 5.5 0 0 1 11 0c0 2.5-2.4 4.5-5.5 4.5S6.5 17.5 6.5 15z" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, style, className, title }: { name: string; size?: number; style?: CSSProperties; className?: string; title?: string }) {
  return (
    <svg
      className={'icon ' + (className ?? '')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name] ?? null}
    </svg>
  );
}
