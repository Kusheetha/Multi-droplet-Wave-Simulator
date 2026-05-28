import React, { useState } from 'react'
import NavSidebar from './components/NavSidebar.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import Header from './components/Header.jsx'
import SimCanvas from './components/SimCanvas.jsx'
import MetricsBar from './components/MetricsBar.jsx'
import useSimulation from './hooks/useSimulation.js'

const DEFAULT_PARAMS = {
  mode: 2,
  num_drops: 3,
  drop_amplitude: 1.0,
  drop_radius: 3,
  c: 10,
  T: 10,
  Nx: 128,
  Ny: 128,
  anim_speed: 3,
  drop_interval: 1.5,
  boundary: 'Absorbing',
}

export default function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const sim = useSimulation()

  const handleStart = () => {
    console.log("START CLICKED")

    sim.startSim({
      mode: params.mode,
      num_drops: params.num_drops,
      drop_amplitude: params.drop_amplitude,
      drop_radius: params.drop_radius,
      c: params.c,
      T: params.T,
      Nx: params.Nx,
      Ny: params.Ny,
      anim_speed: params.anim_speed,
      drop_interval: params.drop_interval,
      boundary: params.boundary,
    })
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-main)'
    }}>
      
      {/* LEFT NAV ICON BAR */}
      <NavSidebar />

      {/* CONTROL PANEL */}
      <ControlPanel
        params={params}
        onChange={setParams}
        status={sim.status}
        progress={sim.progress}
        elapsed={sim.elapsed}
        onStart={handleStart}
        onStop={sim.stopSim}
      />

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        gap: '16px',
      }}>

        {/* TOP HEADER (IMPORTANT: bigger like template) */}
        <div style={{
          flex: '0 0 auto',
          background: 'var(--bg-panel)',
          borderRadius: '12px',
          border: '1px solid var(--border-dim)',
          padding: '12px 16px'
        }}>
          <Header
            params={params}
            onChange={setParams}
            meta={sim.meta}
          />
        </div>

        {/* SIMULATION AREA */}
        <div style={{
          flex: '0 0 55%',   // 👈 IMPORTANT: NOT too big
          background: 'var(--bg-panel)',
          borderRadius: '12px',
          border: '1px solid var(--border-dim)',
          padding: '10px',
          display: 'flex',
          minHeight: '300px'
        }}>
          <SimCanvas
            currentFrame={sim.currentFrame}
            amplitude={params.drop_amplitude}
            colormap="turbo"
            meta={sim.meta}
            status={sim.status}
          />
        </div>

        {/* METRICS (bigger like template) */}
        <div style={{
          flex: '1',
          background: 'var(--bg-panel)',
          borderRadius: '12px',
          border: '1px solid var(--border-dim)',
          padding: '12px'
        }}>
          <MetricsBar metrics={sim.metrics} />
        </div>

      </div>
    </div>
  )
}