"""
FDM Water Disturbance Simulation — Python port of MATLAB backend.
Physics logic is IDENTICAL to the original MATLAB code.
Only refactored to be callable with parameters passed from the frontend.
"""

import numpy as np
import math
from dataclasses import dataclass, field
from typing import List, Literal


# ---------------------------------------------------------------------------
# Parameter dataclass (mirrors USER PARAMETERS section of MATLAB script)
# ---------------------------------------------------------------------------
@dataclass
class SimParams:
    mode: int = 2                          # 1 = Ring layout, 2 = Concentric centre
    num_drops: int = 3                     # Number of raindrops
    drop_amplitude: float = 1.0           # Amplitude of each raindrop disturbance
    drop_radius: float = 3.0              # Spatial spread (grid cells)
    anim_speed: int = 3                   # Store every N-th frame
    colormap_choice: str = "turbo"        # Colour map label (metadata only for frontend)
    # Physical / grid (kept identical to MATLAB defaults)
    Lx: float = 100.0
    Ly: float = 100.0
    Nx: int = 128
    Ny: int = 128
    c: float = 10.0
    T: float = 10.0
    # Mode-2 timing
    drop_interval: float = 1.5


# ---------------------------------------------------------------------------
# Core simulation — mirrors the MATLAB loop exactly
# ---------------------------------------------------------------------------
def run_simulation(params: SimParams, boundary: Literal["Absorbing", "Reflecting"] = "Absorbing"):
    """
    Returns a dict with:
        frames      : list of (Ny x Nx) numpy arrays
        frame_times : list of floats (physical time for each frame)
        meta        : dict of scalar diagnostics
    """
    # ---- 1. PHYSICAL PARAMETERS & GRID SETUP (verbatim from MATLAB) ----
    Lx, Ly = params.Lx, params.Ly
    Nx, Ny = params.Nx, params.Ny
    dx = Lx / (Nx - 1)
    dy = Ly / (Ny - 1)
    c  = params.c
    T  = params.T
    dt = 0.4 * min(dx, dy) / (c * math.sqrt(2))
    Nt = round(T / dt)

    r2x = (c * dt / dx) ** 2
    r2y = (c * dt / dy) ** 2

    x = np.linspace(0, Lx, Nx)
    y = np.linspace(0, Ly, Ny)

    # ---- 2. DROP POSITIONS (verbatim from MATLAB) ----
    cx = Lx / 2.0
    cy = Ly / 2.0
    R  = Lx * 0.28
    num_drops = params.num_drops

    if params.mode == 1:
        # MODE 1 — Symmetric ring, ALL drops fire simultaneously
        if num_drops == 1:
            drop_x = np.array([cx])
            drop_y = np.array([cy])
        elif num_drops == 2:
            drop_x = np.array([cx - R * 0.5, cx + R * 0.5])
            drop_y = np.array([cy, cy])
        else:
            angles = np.linspace(0, 2 * math.pi, num_drops + 1)[:-1] + math.pi / 2
            drop_x = cx + R * np.cos(angles)
            drop_y = cy + R * np.sin(angles)

        pad = 0.05 * Lx
        drop_x = np.clip(drop_x, pad, Lx - pad)
        drop_y = np.clip(drop_y, pad, Ly - pad)
        drop_times = np.zeros(num_drops)       # all fire at t = 0

    else:
        # MODE 2 — All drops at centre, one by one (concentric rings)
        drop_interval = params.drop_interval
        drop_x = np.full(num_drops, cx)
        drop_y = np.full(num_drops, cy)
        drop_times = np.arange(num_drops) * drop_interval

    drop_steps = np.round(drop_times / dt).astype(int)

    # CFL diagnostics
    cfl_x = math.sqrt(r2x)
    cfl_y = math.sqrt(r2y)

    # ---- Pre-build per-drop Gaussian patches (verbatim from MATLAB) ----
    drop_radius = params.drop_radius
    drop_amplitude = params.drop_amplitude
    drop_patch = []
    for k in range(num_drops):
        ix = round(drop_x[k] / dx)      # 0-indexed equivalent of MATLAB's +1
        iy = round(drop_y[k] / dy)
        patch = np.zeros((Ny, Nx))
        r_int = int(drop_radius)
        for ii in range(max(0, iy - 3*r_int), min(Ny, iy + 3*r_int + 1)):
            for jj in range(max(0, ix - 3*r_int), min(Nx, ix + 3*r_int + 1)):
                r = math.sqrt((jj - ix)**2 + (ii - iy)**2)
                patch[ii, jj] = drop_amplitude * math.exp(-r**2 / (2 * drop_radius**2))
        drop_patch.append(patch)

    # ---- INITIALIZE (verbatim from MATLAB) ----
    u_prev = np.zeros((Ny, Nx))
    u_curr = np.zeros((Ny, Nx))
    u_next = np.zeros((Ny, Nx))

    for k in range(num_drops):
        if drop_steps[k] == 0:
            u_prev += drop_patch[k]
            u_curr += drop_patch[k]

    # Mur boundary history buffers
    b_bot_prev = u_curr[0:2, :].copy();   b_bot_curr = u_curr[0:2, :].copy()
    b_top_prev = u_curr[-2:, :].copy();   b_top_curr = u_curr[-2:, :].copy()
    b_lft_prev = u_curr[:, 0:2].copy();   b_lft_curr = u_curr[:, 0:2].copy()
    b_rgt_prev = u_curr[:, -2:].copy();   b_rgt_curr = u_curr[:, -2:].copy()

    anim_speed = params.anim_speed
    n_frames_est = Nt // anim_speed
    frames = []
    frame_times = []

    # ---- MAIN TIME LOOP (verbatim from MATLAB) ----
    for n in range(1, Nt + 1):

        # Inject mid-simulation drops (MODE 2)
        for k in range(num_drops):
            if drop_steps[k] == n:
                u_curr = u_curr + drop_patch[k]
                u_prev = u_prev + drop_patch[k]

        # FDM interior stencil
        i = slice(1, Ny - 1)   # rows 1..Ny-2  (MATLAB 2:Ny-1)
        j = slice(1, Nx - 1)   # cols 1..Nx-2

        lap_x = r2x * (u_curr[i, 2:] - 2*u_curr[i, 1:-1] + u_curr[i, :-2])
        lap_y = r2y * (u_curr[2:, j] - 2*u_curr[1:-1, j] + u_curr[:-2, j])
        u_next[i, j] = 2*u_curr[i, j] - u_prev[i, j] + lap_x + lap_y

        # ---- BOUNDARY CONDITIONS (verbatim from MATLAB) ----
        if boundary == "Reflecting":
            u_next[0,  :]  = u_next[1,   :]
            u_next[-1, :]  = u_next[-2,  :]
            u_next[:, 0 ]  = u_next[:, 1  ]
            u_next[:, -1]  = u_next[:, -2 ]

        else:  # Absorbing (Mur 2nd-order)
            cdt_dx = c * dt / dx
            cdt_dy = c * dt / dy
            C1x = (cdt_dx - 1) / (cdt_dx + 1)
            C2x =  2           / (cdt_dx + 1)
            C3x = (cdt_dx)**2  / (2*(cdt_dx + 1))
            C1y = (cdt_dy - 1) / (cdt_dy + 1)
            C2y =  2           / (cdt_dy + 1)
            C3y = (cdt_dy)**2  / (2*(cdt_dy + 1))

            # Bottom edge
            u_next[0, 1:-1] = (
                -b_bot_prev[1, 1:-1]
                + C1y * (u_next[1, 1:-1] + b_bot_prev[0, 1:-1])
                + C2y * (u_curr[0, 1:-1] + u_curr[1, 1:-1])
                + C3y * (u_curr[0, :-2] - 2*u_curr[0, 1:-1] + u_curr[0, 2:]
                       + u_curr[1, :-2] - 2*u_curr[1, 1:-1] + u_curr[1, 2:])
            )
            # Top edge
            u_next[-1, 1:-1] = (
                -b_top_prev[0, 1:-1]
                + C1y * (u_next[-2, 1:-1] + b_top_prev[1, 1:-1])
                + C2y * (u_curr[-1, 1:-1] + u_curr[-2, 1:-1])
                + C3y * (u_curr[-1, :-2] - 2*u_curr[-1, 1:-1] + u_curr[-1, 2:]
                       + u_curr[-2, :-2] - 2*u_curr[-2, 1:-1] + u_curr[-2, 2:])
            )
            # Left edge
            u_next[1:-1, 0] = (
                -b_lft_prev[1:-1, 1]
                + C1x * (u_next[1:-1, 1] + b_lft_prev[1:-1, 0])
                + C2x * (u_curr[1:-1, 0] + u_curr[1:-1, 1])
                + C3x * (u_curr[:-2, 0] - 2*u_curr[1:-1, 0] + u_curr[2:, 0]
                       + u_curr[:-2, 1] - 2*u_curr[1:-1, 1] + u_curr[2:, 1])
            )
            # Right edge
            u_next[1:-1, -1] = (
                -b_rgt_prev[1:-1, 0]
                + C1x * (u_next[1:-1, -2] + b_rgt_prev[1:-1, 1])
                + C2x * (u_curr[1:-1, -1] + u_curr[1:-1, -2])
                + C3x * (u_curr[:-2, -1] - 2*u_curr[1:-1, -1] + u_curr[2:, -1]
                       + u_curr[:-2, -2] - 2*u_curr[1:-1, -2] + u_curr[2:, -2])
            )
            # Corners
            u_next[0,  0 ] = 0.5 * (u_next[0,  1 ] + u_next[1,  0 ])
            u_next[0,  -1] = 0.5 * (u_next[0,  -2] + u_next[1,  -1])
            u_next[-1, 0 ] = 0.5 * (u_next[-1, 1 ] + u_next[-2, 0 ])
            u_next[-1, -1] = 0.5 * (u_next[-1, -2] + u_next[-2, -1])

            # Update Mur buffers
            b_bot_prev = b_bot_curr.copy(); b_bot_curr = u_next[0:2, :].copy()
            b_top_prev = b_top_curr.copy(); b_top_curr = u_next[-2:, :].copy()
            b_lft_prev = b_lft_curr.copy(); b_lft_curr = u_next[:, 0:2].copy()
            b_rgt_prev = b_rgt_curr.copy(); b_rgt_curr = u_next[:, -2:].copy()

        u_prev = u_curr.copy()
        u_curr = u_next.copy()

        if n % anim_speed == 0:
            frames.append(u_curr.copy())
            frame_times.append(n * dt)

    return {
        "frames": frames,
        "frame_times": frame_times,
        "meta": {
            "Nx": Nx, "Ny": Ny,
            "Nt": Nt, "dt": dt,
            "cfl_x": cfl_x, "cfl_y": cfl_y,
            "drop_x": drop_x.tolist(),
            "drop_y": drop_y.tolist(),
            "num_frames": len(frames),
            "boundary": boundary,
            "mode": params.mode,
        }
    }