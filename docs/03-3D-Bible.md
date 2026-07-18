# Portfolio AI Operating System Blueprint
## Volume 3 — 3D Experience & AI Core Engine Bible
Version 3.0 • Certified Production Standard

---

## Chapter 1 — 3D Philosophy

The three-dimensional rendering environment exists exclusively to support and contextualise the portfolio's text content. It must never compete for visual attention or cause cognitive fatigue. The technology should disappear behind a seamless, responsive, and luxurious digital ecosystem.

---

## Chapter 2 — Graphics Stack

The graphics engine relies on hardware-accelerated pathways rendering directly to canvas boundaries:
```
Vanilla HTML Layout (DOM)
  └── Custom Javascript Core (main.js)
        └── Three.js Engine API
              └── WebGL context
                    └── GPU Shader Pipelines (GLSL)
```
*Note: Post-processing runs inside a lightweight custom shader pass to minimize draw calls and ensure performance is prioritized.*

---

## Chapter 3 — Scene Architecture

The scene graph organizes entities systematically to maintain garbage-collection efficiency:
* **Root Scene**: Translucent backdrop.
* **Camera System**: Perspective camera binding scroll metrics.
* **Lighting Rigs**: Dynamic directional lights and theme-mapped point lights.
* **Core Geometries Group**: Nested Concentric Torus elements and inner emissive sphere.
* **Knowledge Chamber Group**: Floating platform geometry layers.
* **Technology Constellation**: Connected vertex node arrays.
* **Timeline Corridor**: Nested torus loops.
* **Universal Particle Systems**: Drifting spark cloud.

---

## Chapter 4 — AI Core Construction

The signature WebGL orb is constructed entirely from procedural geometries:
1. **Outer Ring**: Large Torus geometry with high radial segments, spinning on coordinate X.
2. **Inner Ring**: Torus geometry nested inside the outer ring, spinning on coordinate Y.
3. **Energy Sphere Shell**: Emissive physical sphere utilizing glass transmission properties.
4. **Orbital Satellites**: Nested spheres tracing angular mathematical offsets (`Math.cos`/`Math.sin`).
5. **Universal Sparks Cloud**: Points buffers swirl wrapping around the core.

---

## Chapter 5 — Materials Specification

* **Emissive Glass (Energy Core)**:
  `MeshPhysicalMaterial` • `roughness: 0.1` • `metalness: 0.1` • `transmission: 0.6` • `thickness: 0.5` • `emissiveIntensity: 1.5`
* **Reflective Chrome (Rings)**:
  `MeshStandardMaterial` • `roughness: 0.15` • `metalness: 0.95`
* **Translucent Platform (Knowledge Chamber)**:
  `MeshPhysicalMaterial` • `roughness: 0.1` • `transmission: 0.9` • `thickness: 1.0` • `opacity: 0.4`

---

## Chapter 6 — Lighting Architecture

* **Key Light**: Directional light (`intensity: 0.65`) casting subtle high-range highlights on metallic surfaces.
* **Ambient Light**: Soft white light (`intensity: 0.35`) defining base structural shapes.
* **Active Point Light**: Dynamic point light (`intensity: 2.0`) mapped to active camera positions and theme colors.

---

## Chapter 7 — HDRI Environment

Simulated environmental reflections are achieved through high-contrast radial gradients inside the canvas backdrop to keep asset loads lightweight. This achieves soft, realistic reflections without requiring heavy `.hdr` or `.exr` file assets.

---

## Chapter 8 — Camera System

* **Projection**: `PerspectiveCamera` • `FOV: 50` • `Near: 0.1` • `Far: 100`
* **Cinematic Damping**: Camera transitions use linear interpolation (LERP) formulas to transition coordinates (`x`, `y`, `z`) smoothly over scroll updates.
* **Idle sway**: Integrates a gentle drift based on mouse coordinates relative to viewport bounds.

---

## Chapter 9 — Camera Choreography

The camera follows specific framing positions based on scroll offsets:
* **Landing (Hero)**: `x = 0, y = 0, z = 5.5` (Core orb framed on the right)
* **About (Knowledge)**: `x = -1.8, y = -3, z = 5.5` (Camera focuses on left platform)
* **Skills (Technology)**: `x = 1.6, y = -6, z = 5.5` (Camera sways right to reveal constellation links)
* **Projects (Gallery)**: `x = -1.5, y = -9, z = 5.5` (Sway left past rotating boxes)
* **Corridor & Contact**: `x = 0.5, y = -12 to -15, z = 5.5` (Centered framing looking down the pathway)

---

## Chapter 10 — Orbit System

Concentric orbit systems rotate independently around the AI Core:
* **Torus 1**: Spin speed factor `0.004` on axes `Y` and `X`.
* **Torus 2**: Spin speed factor `-0.006` on axes `Y` and `Z`.
* **Satellites**: Particle orbits speed up by `2.5x` during hover events.

---

## Chapter 11 — Particle Architecture

* **Drifting Sparks**: Swirling particle cloud. Mapped to vertical bounds and drifts down continuously, wrapping around core meshes.
* **Neural Connections**: Backdrop connector points map to user interactions.

---

## Chapter 12 — Physics

Physical movements use soft damping to simulate gravity and drag:
* **Velocity LERP**: Speed updates decay using a multiplier of `0.06` per tick.
* **Hover Pulls**: Mouse proximity pulls target points toward the pointer coordinates gently, settling back when interaction ends.

---

## Chapter 13 — Shader System

Backdrop elements utilize custom procedural shaders where necessary. High-frequency noise filters and color-shifting radial gradients simulate cinematic lighting changes on theme shifts without drawing heavy raster files.

---

## Chapter 14 — Post Processing

To preserve high frame rates across mobile devices, post-processing is modeled using lightweight WebGL blending techniques:
* **Bloom**: Modeled via additive point sprites and high-emissive glow materials.
* **Tone Mapping**: Managed through browser-native CSS color spaces.

---

## Chapter 15 — Reflection System

Glass responds to lighting. Reflection updates with camera movement. Dynamic reflections are calculated by synchronizing the coordinate positions of reflective materials with the camera's viewport matrix. As the user sways their cursor, metallic rings reflect light changes across their surfaces.

---

## Chapter 16 — Environment Animation

The 3D environment is never static:
* Sparks drift downwards continuously.
* Theme mutations trigger smooth material color adjustments.
* Idle sways simulate ambient currents.

---

## Chapter 17 — GPU Optimization

Performance budgeting rules:
* Share geometries and materials across identical components.
* Deactivate Three.js tick updates if the canvas scrolls out of viewport.
* Limit pixel ratio scales to `Math.min(window.devicePixelRatio, 2)`.

---

## Chapter 18 — Mobile 3D Strategy

Mobile browsers trigger optimization routines automatically:
* Particle counts are capped.
* WebGL pixel ratios are set to `1.0`.
* High-thickness glass transmissions are simplified to basic transparencies.

---

## Chapter 19 — Asset Pipeline

* **Procedural-first**: Geometry files are generated programmatically in code to ensure immediate, zero-latency rendering.
* **Font pre-connections**: CDN requests are pre-resolved in index headers.

---

## Chapter 20 — AI Core Lifecycle

1. **Boot**: Loading screen Emblem logo pulses.
2. **Initialize**: Assets load, WebGL elements bind.
3. **Power Up**: Modal fades out, core rings spin up.
4. **Idle**: Ambient breathing and slow particles drift.
5. **Interaction**: Core speeds up on scroll, sways on cursor hovers.
6. **Sleep**: Fades out when off-screen.

---

## Chapter 21 — Scene Loading

The load sequence is optimized to avoid blocking render trees:
```
Font Preconnects
  └── HTML DOM Render
        └── Backdrop Particles
              └── Three.js Canvas Injection
                    └── Constellation Geometry Builds
                          └── Active Interactions Enabled
```

---

## Chapter 22 — Quality Assurance

Before release, the SRE team validates lighting, materials, particles, camera, FPS, memory, and responsiveness.

---

## Chapter 23 — Performance Targets

* **High-end Desktop**: `60` / `120` FPS.
* **Modern Laptop**: `60` FPS.
* **Mobile / Tablet**: `30` / `60` FPS.
* **Worst-case fallback**: Disables WebGL if performance drops below `35` FPS for 3 consecutive seconds.

---

## Chapter 24 — Definition of 3D Excellence

The 3D engine is considered excellent only when the technology becomes invisible. The visitor does not think about the rendering code, but rather feels that they are exploring an active digital system.
