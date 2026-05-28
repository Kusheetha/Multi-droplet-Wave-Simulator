import React from 'react'
import { Minus, Plus } from 'lucide-react'

const s = {
  panel: {
    width: 280, background: 'var(--bg-panel)',
    borderRight: '1px solid var(--border-dim)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto', flexShrink: 0,
  },
  section: {
    padding: '14px 14px 10px',
    borderBottom: '1px solid var(--border-dim)',
  },
  sectionTitle: {
    fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
    color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10,
  },
  label: {
    fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5, display: 'block',
  },
  input: {
    width: '100%', background: 'var(--bg-card)',
    border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: 12, padding: '6px 10px',
    marginBottom: 8,
  },
  stepper: {
    display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8,
    border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
    overflow: 'hidden', background: 'var(--bg-card)',
  },
  stepBtn: {
    width: 30, height: 30, background: 'transparent',
    color: 'var(--text-secondary)', fontSize: 14, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    flexShrink: 0,
  },
  stepVal: {
    flex: 1, textAlign: 'center', color: 'var(--text-primary)',
    fontSize: 12, background: 'transparent', border: 'none',
    padding: '0 4px',
  },
  toggle: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  toggleBtn: (active) => ({
    padding: '7px 10px', borderRadius: 'var(--radius-sm)',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'transparent'}`,
    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
    fontSize: 11, cursor: 'pointer', textAlign: 'left',
    transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: 6,
  }),
  dot: (active) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: active ? 'var(--accent-blue)' : 'var(--text-dim)',
  }),
  select: {
    width: '100%', background: 'var(--bg-card)',
    border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: 12, padding: '6px 10px',
    marginBottom: 8, appearance: 'none',
  },
  simBtn: (running) => ({
    margin: '10px 14px', padding: '10px', borderRadius: 'var(--radius-md)',
    background: running
      ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))'
      : 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))',
    border: `1px solid ${running ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.5)'}`,
    color: running ? '#ef4444' : 'var(--accent-cyan)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    letterSpacing: '0.05em', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, transition: 'var(--transition)',
  }),
  statusArea: {
    padding: '10px 14px', borderTop: '1px solid var(--border-dim)',
    marginTop: 'auto',
  },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
    fontSize: 10, color: 'var(--text-muted)',
  },
  statusDot: (color) => ({
    width: 7, height: 7, borderRadius: '50%', background: color,
    boxShadow: `0 0 6px ${color}`,
  }),
  progressBar: {
    width: '100%', height: 3, background: 'var(--bg-elevated)',
    borderRadius: 2, overflow: 'hidden', marginTop: 4,
  },
  progressFill: (pct) => ({
    height: '100%', width: `${pct}%`,
    background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
    transition: 'width 0.3s ease',
  }),
}

function Stepper({ label, value, onChange, min = 1, max = 20, step = 1 }) {
  return (
    <>
      <span style={s.label}>{label}</span>
      <div style={s.stepper}>
        <button style={s.stepBtn} onClick={() => onChange(Math.max(min, value - step))}>
          <Minus size={12} />
        </button>
        <input
            style={s.stepVal}
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
                const val = e.target.value;

                if (val === "") return;

                const num = parseInt(val);
                if (isNaN(num)) return;

                onChange(Math.max(min, Math.min(max, num)));
            }}
        />
        <button style={s.stepBtn} onClick={() => onChange(Math.min(max, value + step))}>
          <Plus size={12} />
        </button>
      </div>
    </>
  )
}

export default function ControlPanel({ params, onChange, status, progress, elapsed, onStart, onStop }) {
  const running = status === 'computing' || status === 'streaming'

  const set = (key) => (val) => onChange({ ...params, [key]: val })

  const statusColor = {
    idle: 'var(--text-dim)',
    computing: 'var(--accent-amber)',
    streaming: 'var(--accent-green)',
    done: 'var(--accent-blue)',
    error: 'var(--accent-red)',
  }[status] || 'var(--text-dim)'

  const statusLabel = {
    idle: 'Ready',
    computing: 'Computing...',
    streaming: 'Running',
    done: 'Complete',
    error: 'Error',
  }[status] || 'Ready'

  const fmtTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = String(s % 60).padStart(2, '0')
    return `${String(m).padStart(2, '0')}:${sec}`
  }

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border-dim)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Fluid Dynamics
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>FDM Simulation</div>
      </div>

      {/* Simulation Controls */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Simulation Controls</div>

        <Stepper label="Droplet Count" value={params.num_drops} onChange={set('num_drops')} min={1} max={12} />

        <span style={s.label}>Droplet Radius</span>
        <input style={s.input} type="number" step="0.5" min="1" max="10"
          value={params.drop_radius}
          onChange={e => set('drop_radius')(parseFloat(e.target.value))} />

        <span style={s.label}>Wave Amplitude</span>
        <input style={s.input} type="number" step="0.1" min="0.1" max="5"
          value={params.drop_amplitude}
          onChange={e => set('drop_amplitude')(parseFloat(e.target.value))} />

        <span style={s.label}>Wave Speed (c)</span>
        <input style={s.input} type="number" step="1" min="1" max="30"
          value={params.c}
          onChange={e => set('c')(parseFloat(e.target.value))} />

        <span style={s.label}>Grid Resolution</span>
        <select style={s.select} value={params.Nx}
          onChange={e => { const v = parseInt(e.target.value); onChange({ ...params, Nx: v, Ny: v }) }}>
          <option value={64}>64 × 64</option>
          <option value={128}>128 × 128</option>
          <option value={192}>192 × 192</option>
          <option value={256}>256 × 256</option>
        </select>
      </div>

      {/* Boundary Condition */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Boundary Condition</div>
        <div style={s.toggle}>
          {['Absorbing', 'Reflecting'].map(b => (
            <button key={b} style={s.toggleBtn(params.boundary === b)}
              onClick={() => set('boundary')(b)}>
              <span style={s.dot(params.boundary === b)} />
              {b} Boundary
            </button>
          ))}
        </div>
      </div>

      {/* Time Control */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Time Control</div>

        <span style={s.label}>Animation Speed (dt factor)</span>
        <input style={s.input} type="number" step="1" min="1" max="10"
          value={params.anim_speed}
          onChange={e => set('anim_speed')(parseInt(e.target.value))} />

        <span style={s.label}>Total Time (T)</span>
        <input style={s.input} type="number" step="1" min="1" max="30"
          value={params.T}
          onChange={e => set('T')(parseFloat(e.target.value))} />

        {params.mode === 2 && (
          <>
            <span style={s.label}>Drop Interval (s)</span>
            <input style={s.input} type="number" step="0.5" min="0.5" max="5"
              value={params.drop_interval}
              onChange={e => set('drop_interval')(parseFloat(e.target.value))} />
          </>
        )}
      </div>

      {/* Start / Stop */}
      <button style={s.simBtn(running)}
        onClick={running ? onStop : onStart}>
        {running ? '⏸ Pause Simulation' : '▶ Run Simulation'}
      </button>

      {/* Status */}
      <div style={s.statusArea}>
        <div style={s.statusRow}>
          <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 10 }}>Simulation Status</span>
        </div>
        <div style={{ ...s.statusRow, marginBottom: 6 }}>
          <span style={s.statusDot(statusColor)} />
          <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
        </div>
        <div style={{ ...s.statusRow, marginBottom: 6 }}>
          <span>Time Elapsed</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontWeight: 600 }}>
            {fmtTime(elapsed)}
          </span>
        </div>
        {running && (
          <>
            <div style={s.progressBar}>
              <div style={s.progressFill(progress)} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
              {progress}%
            </div>
          </>
        )}
      </div>
    </div>
  )
}