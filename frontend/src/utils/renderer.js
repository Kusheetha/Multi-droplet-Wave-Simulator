const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

function syncCanvas(canvas) {
  const rect = canvas.getBoundingClientRect()
  const W = Math.round(rect.width) || canvas.offsetWidth || 400
  const H = Math.round(rect.height) || canvas.offsetHeight || 300
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  return { W, H }
}

function frameStats(data) {
  let absMax = 1e-6
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i])
    if (a > absMax) absMax = a
  }
  return absMax
}

// 🎨 shared color (same everywhere)
function getColor(t) {
  t = clamp(t, 0, 1)

  const r = Math.floor(30 + 180 * Math.pow(t, 1.8))
  const g = Math.floor(80 + 140 * Math.pow(t, 1.4))
  const b = Math.floor(140 + 100 * (1 - t))

  return [r, g, b]
}

// ─── 2D VIEW ─────────────────────────────────────────────────────────

export function drawTopView(canvas, frame) {
  if (!frame || !canvas) return

  const { rows, cols, data } = frame
  const { W, H } = syncCanvas(canvas)
  if (W === 0 || H === 0) return

  const ctx = canvas.getContext('2d')
  const absMax = frameStats(data)

  const img = ctx.createImageData(cols, rows)
  const px = img.data

  for (let i = 0; i < data.length; i++) {
    const v = data[i]
    const p = i * 4

    let t = (v + absMax) / (2 * absMax)
    const [r, g, b] = getColor(t)

    px[p] = r
    px[p + 1] = g
    px[p + 2] = b
    px[p + 3] = 255
  }

  const tmp = document.createElement('canvas')
  tmp.width = cols
  tmp.height = rows
  tmp.getContext('2d').putImageData(img, 0, 0)

  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(tmp, 0, 0, W, H)
}

// ─── 3D VIEW (FIXED + SMOOTH) ────────────────────────────────────────

export function drawIsoView(canvas, frame) {
  if (!frame || !canvas) return

  const { rows, cols, data } = frame
  const { W, H } = syncCanvas(canvas)
  if (W === 0 || H === 0) return

  const ctx = canvas.getContext('2d')
  const absMax = frameStats(data)

  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  // ✅ FIXED SCALE (no cropping)
  const scale = Math.min(W, H) / (rows + cols) * 1.4  // zoom OUT slightly

  // ✅ FIXED HEIGHT (no puffiness)
  const zScale = H * 0.08 / absMax

  const cx = W / 2
  const cy = H * 0.26

  const proj = (x, y, z) => ({
    x: cx + (x - y) * scale,
    y: cy + (x + y) * scale * 0.5 - z * zScale
  })

  // 🔥 smoothness
  const RES = 4

  // bilinear interpolation
  const sample = (fx, fy) => {
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)

    const x1 = Math.min(x0 + 1, cols - 1)
    const y1 = Math.min(y0 + 1, rows - 1)

    const dx = fx - x0
    const dy = fy - y0

    const v00 = data[y0 * cols + x0]
    const v10 = data[y0 * cols + x1]
    const v01 = data[y1 * cols + x0]
    const v11 = data[y1 * cols + x1]

    return (
      v00 * (1 - dx) * (1 - dy) +
      v10 * dx * (1 - dy) +
      v01 * (1 - dx) * dy +
      v11 * dx * dy
    )
  }

  // painter's algorithm
  for (let i = 0; i < rows - 1; i++) {
    for (let j = cols - 2; j >= 0; j--) {

      for (let si = 0; si < RES; si++) {
        for (let sj = 0; sj < RES; sj++) {

          const fx = j + sj / RES
          const fy = i + si / RES

          const fx1 = j + (sj + 1) / RES
          const fy1 = i + (si + 1) / RES

          const v00 = sample(fx, fy)
          const v10 = sample(fx1, fy)
          const v11 = sample(fx1, fy1)
          const v01 = sample(fx, fy1)

          const vAvg = (v00 + v10 + v11 + v01) * 0.25

          let t = (vAvg + absMax) / (2 * absMax)
          const [r, g, b] = getColor(t)

          const P00 = proj(fx, fy, v00)
          const P10 = proj(fx1, fy, v10)
          const P11 = proj(fx1, fy1, v11)
          const P01 = proj(fx, fy1, v01)

          ctx.fillStyle = `rgb(${r},${g},${b})`

          ctx.beginPath()
          ctx.moveTo(P00.x, P00.y)
          ctx.lineTo(P10.x, P10.y)
          ctx.lineTo(P11.x, P11.y)
          ctx.lineTo(P01.x, P01.y)
          ctx.closePath()
          ctx.fillStyle = `rgb(${r},${g},${b})`

          ctx.fill()
        }
      }
    }
  }
}