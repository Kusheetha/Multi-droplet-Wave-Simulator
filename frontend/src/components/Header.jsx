import React from 'react'
import { Activity, Grid, Zap } from 'lucide-react'

const s = {
  header: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '0 20px', height: 80,
    background: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-dim)',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: 11, color: 'var(--text-muted)', marginTop: 1,
  },
  divider: {
    width: 1, height: 28, background: 'var(--border-dim)',
    margin: '0 4px',
  },
  stat: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
    minWidth: 70,
  },
  statLabel: {
    fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  statIcon: {
    color: 'var(--accent-cyan)', opacity: 0.7,
  },
  spacer: { flex: 1 },
  modeBtns: {
    display: 'flex', gap: 1, background: 'var(--bg-card)',
    border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)',
    padding: 3, overflow: 'hidden',
  },
  modeBtn: (active) => ({
    padding: '5px 14px', borderRadius: 7,
    background: active ? 'var(--bg-elevated)' : 'transparent',
    border: `1px solid ${active ? 'var(--border-bright)' : 'transparent'}`,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    fontSize: 11, cursor: 'pointer', fontWeight: active ? 600 : 400,
    transition: 'var(--transition)',
  }),
}

export default function Header({ params, onChange, meta }) {
  const cfl = meta?.cfl_x?.toFixed(2) || '—'
  const grid = meta ? `${meta.Nx}×${meta.Ny}` : `${params.Nx}×${params.Ny}`

  return (
    <div style={s.header}>
      <div>
        <div style={s.title}>Multi-Droplet Wave Simulation</div>
        <div style={s.subtitle}>2D & 3D Wave Propagation using Finite Difference Method</div>
      </div>

      <div style={s.divider} />

      <div style={s.stat}>
        <span style={s.statLabel}>CFL Number</span>
        <span style={s.statValue}>
          <Activity size={12} style={s.statIcon} />
          {cfl}
        </span>
      </div>

      <div style={s.stat}>
        <span style={s.statLabel}>Grid Size</span>
        <span style={s.statValue}>
          <Grid size={12} style={s.statIcon} />
          {grid}
        </span>
      </div>

      <div style={s.stat}>
        <span style={s.statLabel}>Speed (c)</span>
        <span style={s.statValue}>
          <Zap size={12} style={s.statIcon} />
          {params.c}
        </span>
      </div>

      <div style={s.spacer} />

      {/* Mode selector */}
      <div style={s.modeBtns}>
        <button style={s.modeBtn(params.mode === 1)}
          onClick={() => onChange({ ...params, mode: 1 })}>
          ◎ Mode 1: Ring Layout
        </button>
        <button style={s.modeBtn(params.mode === 2)}
          onClick={() => onChange({ ...params, mode: 2 })}>
          ⊙ Mode 2: Concentric Centre
        </button>
      </div>
    </div>
  )
}