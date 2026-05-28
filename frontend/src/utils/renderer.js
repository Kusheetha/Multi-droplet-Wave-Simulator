/**
 * Renders a flat Float32Array height field onto a canvas.
 */

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

// ------------------ 2D VIEW ------------------
export function drawTopView(ctx, frame, W, H) {
  const { rows, cols, data } = frame

  // 🔥 DARK BACKGROUND (template style)
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  // 🔥 find max amplitude for normalization
  let maxAbs = 0
  for (let i = 0; i < data.length; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(data[i]))
  }
  maxAbs = maxAbs || 1

  // create image buffer
  const img = ctx.createImageData(cols, rows)
  const pixels = img.data

  for (let i = 0; i < data.length; i++) {
    let v = data[i]

    // normalize to 0–1
    let norm = (v + maxAbs) / (2 * maxAbs)
    norm = Math.pow(norm, 0.6)   // <--- makes peaks brighter
    norm = clamp(norm, 0, 1)

    // 🔥 SMOOTH DARK-BLUE → CYAN → YELLOW palette
    const r = Math.floor(20 + 200 * Math.pow(norm, 1.5))
    const g = Math.floor(40 + 180 * Math.pow(norm, 2.0))
    const b = Math.floor(120 + 135 * (1 - norm))

    const idx = i * 4
    pixels[idx] = r
    pixels[idx + 1] = g
    pixels[idx + 2] = b
    pixels[idx + 3] = 255
  }

  // draw via temp canvas (smooth scaling)
  const tmp = document.createElement('canvas')
  tmp.width = cols
  tmp.height = rows
  const tctx = tmp.getContext('2d')
  tctx.putImageData(img, 0, 0)

  ctx.imageSmoothingEnabled = true
  ctx.drawImage(tmp, 0, 0, W, H)

  // 🔥 GLOW EFFECT (important)
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 0.15
  ctx.drawImage(tmp, 0, 0, W, H)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

// ------------------ 3D VIEW ------------------
export function drawIsoView(canvas, frame, amplitude = 1.0) {
  if (!frame || !canvas) return

  const { rows, cols, data } = frame
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  // background
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2
  const cy = H * 0.5

  const scaleX = W / cols * 0.8
  const scaleY = H / rows * 0.4
  const heightScale = H * 0.25 / amplitude

  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {

      // 4 corners (THIS IS THE KEY)
      const v1 = data[i * cols + j]
      const v2 = data[i * cols + (j + 1)]
      const v3 = data[(i + 1) * cols + (j + 1)]
      const v4 = data[(i + 1) * cols + j]

      // average height (smooth surface)
      const v = (v1 + v2 + v3 + v4) / 4

      // normalize (same as 2D)
      let norm = (v + amplitude) / (2 * amplitude)
      norm = Math.pow(norm, 0.6)   // <--- makes peaks brighter
      norm = clamp(norm, 0, 1)

      // same color as 2D
      const r = Math.floor(20 + 200 * Math.pow(norm, 1.5))
      const g = Math.floor(40 + 180 * Math.pow(norm, 2.0))
      const b = Math.floor(120 + 135 * (1 - norm))
      const shade = 0.7 + 0.3 * norm
      const rr = Math.floor(r * shade)
      const gg = Math.floor(g * shade)
      const bb = Math.floor(b * shade)

      ctx.fillStyle = `rgb(${rr}, ${gg}, ${bb})`

      // 4 projected points
      const p = (i, j, val) => {
      const x = (j - cols / 2)
      const y = (i - rows / 2)
      const z = val
        return {
          x: cx + (x - y) * scaleX * 0.7,
          y: cy + (x + y) * scaleY * 0.4 - z * heightScale
        }
      }

      const P1 = p(i, j, v1)
      const P2 = p(i, j + 1, v2)
      const P3 = p(i + 1, j + 1, v3)
      const P4 = p(i + 1, j, v4)

      // 🔥 DRAW FILLED QUAD (SURFACE)
      ctx.beginPath()
      ctx.moveTo(P1.x, P1.y)
      ctx.lineTo(P2.x, P2.y)
      ctx.lineTo(P3.x, P3.y)
      ctx.lineTo(P4.x, P4.y)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.stroke()
      ctx.closePath()
      ctx.fill()
    }
  }
}