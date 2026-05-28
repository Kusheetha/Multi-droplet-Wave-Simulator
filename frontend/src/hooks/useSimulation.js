import { useRef, useState, useCallback } from 'react'

const WS_URL = 'ws://localhost:8000/ws/simulate'

export default function useSimulation() {
  const wsRef = useRef(null)
  const [status, setStatus]       = useState('idle')   // idle | computing | streaming | done | error
  const [meta, setMeta]           = useState(null)
  const [frames, setFrames]       = useState([])
  const [currentFrame, setCurrent] = useState(null)
  const [progress, setProgress]   = useState(0)
  const [metrics, setMetrics]     = useState({ maxAmp: 0, minAmp: 0, energy: 0, iterations: 0 })
  const [elapsed, setElapsed]     = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const framesRef = useRef([])

  const stopTimer = () => { clearInterval(timerRef.current) }

  const startSim = useCallback((params) => {
    // Close any existing connection
    if (wsRef.current) wsRef.current.close()
    framesRef.current = []
    setFrames([])
    setCurrent(null)
    setProgress(0)
    setMeta(null)
    setStatus('computing')
    setElapsed(0)

    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify(params))
    }

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)

      if (msg.type === 'status') {
        setStatus('computing')
      } else if (msg.type === 'meta') {
        setMeta(msg)
        setStatus('streaming')
      } else if (msg.type === 'frame') {
        const rows = msg.rows, cols = msg.cols
        const flat = msg.data
        const arr = new Float32Array(rows * cols)
        for (let i = 0; i < flat.length; i++) arr[i] = flat[i]
        const frameObj = { t: msg.t, index: msg.index, rows, cols, data: arr }
        framesRef.current.push(frameObj)
        setFrames(prev => [...prev, frameObj])
        setCurrent(frameObj)
        setProgress(Math.round((msg.index / msg.total) * 100))

        // Compute real-time metrics from latest frame
        let maxA = -Infinity, minA = Infinity, energy = 0
        for (let v of flat) {
          if (v > maxA) maxA = v
          if (v < minA) minA = v
          energy += v * v
        }
        setMetrics({
          maxAmp: maxA.toFixed(3),
          minAmp: minA.toFixed(3),
          energy: energy.toFixed(2),
          iterations: msg.index * (params.anim_speed || 3),
        })
      } else if (msg.type === 'done') {
        setStatus('done')
        stopTimer()
      } else if (msg.type === 'error') {
        setStatus('error')
        stopTimer()
        console.error('Sim error:', msg.message)
      }
    }

    ws.onerror = () => { setStatus('error'); stopTimer() }
    ws.onclose = () => { if (status !== 'done') stopTimer() }
  }, [])

  const stopSim = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    stopTimer()
    setStatus('idle')
  }, [])

  // Replay: cycle through stored frames
  const replayRef = useRef(null)
  const replay = useCallback(() => {
    clearInterval(replayRef.current)
    let i = 0
    replayRef.current = setInterval(() => {
      if (i >= framesRef.current.length) { clearInterval(replayRef.current); return }
      setCurrent(framesRef.current[i])
      i++
    }, 33)
  }, [])

  return { status, meta, frames, currentFrame, progress, metrics, elapsed, startSim, stopSim, replay }
}