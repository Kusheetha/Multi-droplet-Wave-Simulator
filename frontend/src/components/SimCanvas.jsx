import React, { useRef, useEffect, useCallback } from 'react'
import { drawTopView, drawIsoView } from '../utils/renderer.js'
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Box } from 'lucide-react'

const s = {
  container: {
    flex: 1, display: 'flex', gap: 5,
    background: 'var(--bg-void)',
    minHeight: 0,
  },
  panel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: 'var(--bg-deep)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 0,
  },
  panelHeader: {
    padding: '8px 12px', borderBottom: '1px solid var(--border-dim)',
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.02)',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, flex: 1,
  },
  toolBtn: {
    width: 26, height: 26, borderRadius: 6, background: 'transparent',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer',
    transition: 'var(--transition)', border: '1px solid transparent',
  },
  canvasWrap: {
    flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden',
  },
  overlay: {
    position: 'absolute', top: 8, right: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
    pointerEvents: 'none', zIndex: 2,
  },
  timeTag: {
    background: 'rgba(2,6,23,0.75)', border: '1px solid var(--border-mid)',
    borderRadius: 4, padding: '2px 8px', fontSize: 10,
    color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)',
  },
  idle: {
    position: 'absolute', inset: 0, display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, color: 'var(--text-muted)', fontSize: 11, zIndex: 1,
  },
  idleIcon: {
    width: 40, height: 40, borderRadius: '50%',
    border: '1px solid var(--border-dim)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-dim)',
  },
  colorbar: {
    position: 'absolute', right: 6, top: 8, bottom: 8,
    width: 10, borderRadius: 3, overflow: 'hidden',
    border: '1px solid var(--border-dim)', zIndex: 2,
  },
}

function ToolBtn({ icon: Icon, title, onClick }) {
  return (
    <button style={s.toolBtn} title={title} onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-mid)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}>
      <Icon size={13} />
    </button>
  )
}

function ColourBar({ colormap }) {
  const cbRef = useRef()

  useEffect(() => {
    const c = cbRef.current
    if (!c) return

    const ctx = c.getContext('2d')
    const w = c.width
    const h = c.height

    const img = ctx.createImageData(w, h)
    const data = img.data

    for (let y = 0; y < h; y++) {
      const t = 1 - y / (h - 1)   // top = max, bottom = min

      // 🔥 SAME COLOR LOGIC AS RENDERER (IMPORTANT)
      const r = Math.floor(30 + 180 * Math.pow(t, 1.8))
      const g = Math.floor(80 + 140 * Math.pow(t, 1.4))
      const b = Math.floor(140 + 100 * (1 - t))

      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = 255
      }
    }

    ctx.putImageData(img, 0, 0)

  }, [colormap])

  return <canvas ref={cbRef} width={10} height={120} style={s.colorbar} />
}
export default function SimCanvas({ currentFrame, amplitude, colormap, meta, status }) {
  const topRef = useRef()
  const isoRef = useRef()
  // Always holds the latest props so the ResizeObserver can redraw without stale closures
  const lastArgsRef = useRef(null)
  const rafRef = useRef(null)

  // Core draw — deferred via rAF so layout is always settled before syncCanvas reads the rect
  const scheduleDraw = useCallback((frame, amp, cmap, metaIn) => {
    // Always update the latest args, even before the rAF fires
    lastArgsRef.current = { frame, amp, cmap, metaIn }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const { frame: f, amp: a, cmap: cm, metaIn: m } = lastArgsRef.current
      const top = topRef.current
      const iso = isoRef.current
      if (!f || !top || !iso) return
      const drops = m ? m.drop_x.map((x, idx) => [x, m.drop_y[idx]]) : []
      drawTopView(top, f)
      drawIsoView(iso, f)
    })
  }, [])

  // Redraw on every new frame / prop change
  useEffect(() => {
    if (!currentFrame) return
    scheduleDraw(currentFrame, amplitude, colormap, meta)
  }, [currentFrame, amplitude, colormap, meta, scheduleDraw])

  // Redraw on container resize (e.g. window resize, panel resize)
  useEffect(() => {
    const top = topRef.current
    const iso = isoRef.current
    if (!top || !iso || typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(() => {
      if (lastArgsRef.current) {
        const { frame, amp, cmap, metaIn } = lastArgsRef.current
        scheduleDraw(frame, amp, cmap, metaIn)
      }
    })
    ro.observe(top.parentElement)
    ro.observe(iso.parentElement)
    return () => ro.disconnect()
  }, [scheduleDraw])

  // Cancel pending rAF on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const isIdle = !currentFrame

  return (
    <div style={s.container}>
      {/* ── 2D Top View ── */}
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <span style={s.panelTitle}>2D Top View (Height Field)</span>
        </div>

        <div style={s.canvasWrap}>
          <canvas ref={topRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

          {isIdle && (
            <div style={s.idle}>
              <div style={s.idleIcon}><Box size={16} /></div>
              <span>Run simulation to view wave field</span>
            </div>
          )}

          {currentFrame && (
            <div style={s.overlay}>
              <span style={s.timeTag}>t = {currentFrame.t.toFixed(3)} s</span>
            </div>
          )}

          <ColourBar colormap={colormap} />
        </div>
      </div>

      {/* ── 3D Isometric View ── */}
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <span style={s.panelTitle}>3D Isometric View</span>
        </div>

        <div style={s.canvasWrap}>
          <canvas ref={isoRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

          {isIdle && (
            <div style={s.idle}>
              <div style={s.idleIcon}><Box size={16} /></div>
              <span>3D surface will appear here</span>
            </div>
          )}

          {currentFrame && (
            <div style={s.overlay}>
              <span style={s.timeTag}>t = {currentFrame.t.toFixed(3)} s</span>
            </div>
          )}

          <ColourBar colormap={colormap} />
        </div>
      </div>
    </div>
  )
}