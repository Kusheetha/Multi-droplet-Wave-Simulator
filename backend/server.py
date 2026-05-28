"""
FastAPI server — streams simulation frames over WebSocket.
Runs both Absorbing and Reflecting boundary simulations in parallel threads.
"""

import asyncio
import json
import base64
import threading
from typing import Optional

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulation import SimParams, run_simulation

app = FastAPI(title="FDM Fluid Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST: validate / preview params
# ---------------------------------------------------------------------------
class SimRequest(BaseModel):
    mode: int = 2
    num_drops: int = 3
    drop_amplitude: float = 1.0
    drop_radius: float = 3.0
    anim_speed: int = 3
    Nx: int = 128
    Ny: int = 128
    c: float = 10.0
    T: float = 10.0
    drop_interval: float = 1.5
    boundary: str = "Absorbing"          # "Absorbing" | "Reflecting"


def _frame_to_payload(frame: np.ndarray, t: float, index: int, total: int) -> dict:
    """Serialise one frame as a compact JSON-friendly dict."""
    # Downsample to 64x64 for fast WS transfer if grid is large
    f = frame
    if f.shape[0] > 64:
        step = f.shape[0] // 64
        f = f[::step, ::step]

    flat = f.flatten().tolist()
    return {
        "type": "frame",
        "index": index,
        "total": total,
        "t": round(t, 5),
        "rows": f.shape[0],
        "cols": f.shape[1],
        "data": flat,
    }


# ---------------------------------------------------------------------------
# WebSocket: stream frames as they are computed
# ---------------------------------------------------------------------------
@app.websocket("/ws/simulate")
async def ws_simulate(websocket: WebSocket):
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        req = SimRequest(**json.loads(raw))
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        await websocket.close()
        return

    params = SimParams(
        mode=req.mode,
        num_drops=req.num_drops,
        drop_amplitude=req.drop_amplitude,
        drop_radius=req.drop_radius,
        anim_speed=req.anim_speed,
        Nx=req.Nx,
        Ny=req.Ny,
        c=req.c,
        T=req.T,
        drop_interval=req.drop_interval,
    )

    # Run simulation in a thread so we don't block the event loop
    loop = asyncio.get_event_loop()
    result: dict = {}
    done_event = threading.Event()

    def _run():
        result["data"] = run_simulation(params, boundary=req.boundary)
        done_event.set()

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    # Send "computing" status
    await websocket.send_text(json.dumps({"type": "status", "message": "computing"}))

    # Wait for simulation to finish (non-blocking poll)
    while not done_event.is_set():
        await asyncio.sleep(0.1)

    sim = result["data"]
    frames = sim["frames"]
    frame_times = sim["frame_times"]
    meta = sim["meta"]
    total = len(frames)

    await websocket.send_text(json.dumps({"type": "meta", **meta}))

    # Stream frames
    for i, (frame, t) in enumerate(zip(frames, frame_times)):
        payload = _frame_to_payload(frame, t, i, total)
        try:
            await websocket.send_text(json.dumps(payload))
        except WebSocketDisconnect:
            return
        # Yield to event loop every 5 frames to stay responsive
        if i % 5 == 0:
            await asyncio.sleep(0)

    await websocket.send_text(json.dumps({"type": "done", "total_frames": total}))


# ---------------------------------------------------------------------------
# REST: quick param-info endpoint
# ---------------------------------------------------------------------------
@app.get("/info")
def info():
    import math
    # Return default CFL info
    p = SimParams()
    dx = p.Lx / (p.Nx - 1)
    dy = p.Ly / (p.Ny - 1)
    dt = 0.4 * min(dx, dy) / (p.c * math.sqrt(2))
    return {
        "cfl": round(p.c * dt / dx, 4),
        "grid": f"{p.Nx}×{p.Ny}",
        "default_fps": round(1 / (dt * p.anim_speed), 1),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")