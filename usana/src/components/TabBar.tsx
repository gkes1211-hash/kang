import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/customers', label: '고객', icon: '👥', end: false },
  { to: '/products', label: '제품', icon: '📦', end: false },
  { to: '/settings', label: '설정', icon: '⚙️', end: false },
];

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
          <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
