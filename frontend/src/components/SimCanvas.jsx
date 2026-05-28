import React, { useRef, useEffect } from 'react'
import { drawTopView, drawIsoView } from '../utils/renderer.js'

export default function SimCanvas({ currentFrame, amplitude, colormap, meta }) {
  const topRef = useRef()
  const isoRef = useRef()

  useEffect(() => {
    if (!currentFrame) return

    const top = topRef.current
    const iso = isoRef.current

    if (!top || !iso) return

    const tctx = top.getContext('2d')
    const ictx = iso.getContext('2d')

    // resize canvas
    top.width = top.offsetWidth
    top.height = top.offsetHeight

    iso.width = iso.offsetWidth
    iso.height = iso.offsetHeight

    drawTopView(tctx, currentFrame, top.width, top.height)
    drawIsoView(iso, currentFrame, amplitude)

  }, [currentFrame, amplitude])

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      gap: '10px'
    }}>

      {/* 2D */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>
          2D Top View (Height Field)
        </div>
        <canvas ref={topRef} style={{ flex: 1, width: '100%' }} />
      </div>

      {/* 3D */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>
          3D Isometric View
        </div>
        <canvas ref={isoRef} style={{ flex: 1, width: '100%', background: 'black' }} />
      </div>

    </div>
  )
}