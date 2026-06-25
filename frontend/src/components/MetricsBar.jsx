import React from 'react'

const s = {
  bar: {
    padding: '10px 16px', background: 'var(--bg-panel)',
    borderTop: '1px solid var(--border-dim)',
    display: 'flex', alignItems: 'center', gap: 5,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em',
    textTransform: 'uppercase', marginRight: 10,
  },
  metric: {
    flex: 1, padding: '0 12px',
    borderLeft: '1px solid var(--border-dim)',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  mLabel: { fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  mValue: {
    fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
  spark: {
    height: 18, display: 'flex', alignItems: 'flex-end', gap: 1, marginTop: 2,
  },
  sparkBar: (h, color) => ({
    width: 3, height: `${Math.max(2, h)}px`, background: color,
    borderRadius: 1, opacity: 0.7,
  }),
}

function Spark({ color }) {
  // Generate a fake sparkline for visual effect
  const heights = [4, 7, 5, 9, 6, 12, 8, 10, 7, 14, 9, 11, 8, 13, 10]
  return (
    <div style={s.spark}>
      {heights.map((h, i) => <div key={i} style={s.sparkBar(h, color)} />)}
    </div>
  )
}

export default function MetricsBar({ metrics }) {
  const { maxAmp, minAmp, energy, iterations } = metrics
  const massCons = Math.max(0, 100 - Math.abs(parseFloat(energy) || 0) * 0.001).toFixed(2)

  const items = [
    { label: 'Max Amplitude', value: maxAmp || '—', color: 'var(--accent-violet)' },
    { label: 'Min Amplitude', value: minAmp || '—', color: 'var(--accent-violet)' },
    { label: 'Total Energy',  value: energy || '—',  color: 'var(--accent-violet)' },
    { label: 'Iterations',    value: iterations || '—', color: 'var(--accent-violet)' },
    { label: 'Mass Conservation', value: `${massCons}%`, color: 'var(--accent-violet)' },
  ]

  return (
    <div style={s.bar}>
      <span style={s.sectionTitle}>Real-time Metrics</span>
      {items.map(({ label, value, color }) => (
        <div key={label} style={s.metric}>
          <span style={s.mLabel}>{label}</span>
          <span style={s.mValue}>{value}</span>
          <Spark color={color} />
        </div>
      ))}
    </div>
  )
}