import React from 'react'
import {
  LayoutDashboard, Activity, Layers, BarChart2,
  Download, Settings, HelpCircle, Droplets
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Activity,        label: 'Simulation', active: true },
  { icon: Layers,          label: 'Presets' },
  { icon: BarChart2,       label: 'Analytics' },
  { icon: Download,        label: 'Export' },
  { icon: Settings,        label: 'Settings' },
  { icon: HelpCircle,      label: 'Help' },
]

const s = {
  sidebar: {
    width: 64, background: 'var(--bg-panel)',
    borderRight: '1px solid var(--border-dim)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '16px 0', gap: 4, flexShrink: 0,
  },
  logo: {
    width: 38, height: 38, borderRadius: 10,
    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  navBtn: (active) => ({
    width: 40, height: 40, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
    cursor: 'pointer', transition: 'var(--transition)',
    border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
  }),
  spacer: { flex: 1 },
}

export default function NavSidebar() {
  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <Droplets size={18} color="#fff" />
      </div>
      {navItems.map(({ icon: Icon, label, active }) => (
        <button key={label} style={s.navBtn(active)} title={label}
          onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}>
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}