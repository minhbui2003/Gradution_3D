# MASTER PROMPT - AI CODING AGENT

Role: You are a senior creative developer, real-time 3D engineer, and UX designer. Build a REAL, editable, deployable graduation invitation website, not a static picture/mockup.

## Product goal
A PUBLIC graduation invitation, open to everyone via one URL, not a personalized invitation to a specific guest. It presents the graduate, event information, stories, RSVP and wishes. Visual direction is an elegant hybrid cinematic 3D journey inspired by the attached original campus photo, original chibi design and five scene-concept references.

Color tokens: navy #10264A, blue #2469BC, paper #F4F7FC, accent gold #F0C66D. One serif display font and one Vietnamese-friendly sans-serif. Style: modern university, soft clouds, tasteful gold light trail, chibi graduate wearing black gown with royal-blue trim, gold stole and optional detachable graduation cap.

## Stack and required architecture
- Next.js App Router + TypeScript + React.
- React Three Fiber + @react-three/drei for ONE shared persistent `<Canvas>`.
- GSAP + ScrollTrigger for one deterministic scroll-controlled animation timeline (`scrub`); optionally Lenis only if necessary, with proper GSAP synchronization and teardown. Prefer native scrolling on mobile.
- CSS/Tailwind for all headings, event text, map, buttons, modals, RSVP and wishes. Do not render long Vietnamese text as 3D textures.
- Clear separation of scene components, shared 3D props, motion controller, UI overlay, assets and data.
- Project should remain runnable if 3D assets are not available. In that case use simple labeled procedural placeholder meshes, clearly marked, with NO fake success claims. Never import a missing GLB.

## Scene design / global scroll progress
Create one story canvas and scroll container around 600-700vh as a starting point; expose global progress p ∈ [0,1]. Each scene is a content window, with transition overlaps. Timing:
- 0.00-0.18 Hero invitation (clouds -> opening envelope -> invitation -> waving graduate). Keep text still/readable at end.
- 0.18-0.42 Campus & Our Story (gold cap leads camera toward campus -> four photo cards appear along curved path -> last card becomes a screen-filling transition).
- 0.42-0.60 Ceremony (photo transitions into auditorium -> chibi walks to stage -> diploma / celebrate -> cap throw -> cap passes close to camera to transition).
- 0.60-0.80 Schedule & Venue (camera motion settles; readable HTML timetable, actual embedded map on demand, external directions button and add-to-calendar button when data is present).
- 0.80-1.00 RSVP & Wishes (RSVP drawer, cards with short public wishes, chibi wave goodbye). No fake submitted/saved states.

Core rule: every scene must have an incoming bridge, a readable pause and an outgoing bridge. Avoid five independently mounted canvases, abrupt cuts and infinite scroll traps. Scroll backwards should reverse all timeline-controlled motion. Ambient blink/cloud sway can run on clock separately. Camera orientation must use look-at interpolation/quaternion smooth rotation; avoid sudden flips. Allow skipping intro and direct navigation to all five scenes.

## 3D asset contract
Look for models in `public/models/`: `graduate.glb`, `cap.glb`, `envelope_body.glb` (optional), `diploma.glb`, `campus_facade.glb` (optional), `campus_gate.glb` (optional), `stage_shell.glb` (optional), `podium.glb` (optional).
Build a model registry and loader that detects missing assets or falls back to procedural geometry. Reuse cap mesh style throughout. Do not assume every Tripo model includes rig/animations. Log available clips in dev mode; map clip names after inspection.
For hero: animate separate envelope flap around hinge pivot; use HTML card for legible invitation text.
For chibi: a single graduate asset with rigged clips if available; independent cap and diploma props. Avoid baking hat/diploma into character if they must be thrown/handed over. For cap throw, deterministic animation must work while seeking backward: use one visible hat at any time and a clear attachment/flight state.
For campus photo accuracy: original photo is one low-angle facade image, so do not pretend it is a perfect 360-degree model. Default to a 2.5D layered photo with shallow camera parallax, or accept a real multi-view/retouched GLB. Do not invent an official campus facade/location.
For auditorium: use simple modular geometry, curtains, podium and instanced seating as the default; use scene shell GLB only if lightweight.
Clouds: layered transparent textures and subtle parallax; no expensive realtime volumetric clouds on mobile.

## UX and real functions
- Hero shows graduate name in editable config; generic invitation to friends/family/teachers (no personalized guest name). Event date and venue must be `TBA` until filled in config. Never invent actual event time, address or map coordinates.
- Quick-nav and progress indicator, skip animation, reduced-motion control, mute (off by default if music exists).
- Story includes 4 entries with editable images and short captions, no fake personal photos; use clear placeholders.
- Schedule and Venue have readable HTML, map preview loaded only after interaction, working external directions link once venue URL exists, downloadable ICS or Google Calendar URL once all event data is set.
- RSVP is a drawer containing name, attend yes/no, party size and optional message. Wishing wall has text and optional image upload, with moderation. MVP uses an explicit adapter layer with a demo state; never claim persistence until a backend is implemented.
- Forms must be keyboard accessible, accessible labels, validation, loading and error states.

## Technical performance
- Use `useGLTF`, preloading for next upcoming scene only, lazy-load optional assets.
- Prefer GLB + compressed textures (KTX2 if pipeline available), GLTF mesh compression, reasonable LOD, limit DPR (mobile target max 1.5) and disable costly postprocessing on low power devices.
- Use `prefers-reduced-motion` fallback to static sections. Provide no-WebGL fallback. Avoid massive shader particles and texture allocations.
- Do not scroll-jack mobile gesture; touch scrolling must feel native.
- ScrollTrigger `refresh()` after layout/asset changes, proper cleanup on unmount, no double-initialization in React StrictMode, cleanup observers/RAF/listeners.
- Test mobile and desktop, scene progression backwards, fast scroll and slow scroll; verify interactions while canvas is active.

## Files / components
Create at minimum:
`src/app/page.tsx`, `src/app/globals.css`,
`src/config/event.ts`, `src/config/scenes.ts`, `src/config/assets.ts`,
`src/components/experience/ExperienceCanvas.tsx`, `ScrollDirector.tsx`, `CameraRig.tsx`,
`src/components/experience/scenes/InvitationScene.tsx`, `CampusScene.tsx`, `CeremonyScene.tsx`, `EventScene.tsx`, `WishesScene.tsx`,
`src/components/experience/models/Graduate.tsx`, `Cap.tsx`, `Envelope.tsx`, `Diploma.tsx`,
`src/components/ui/InvitationOverlay.tsx`, `StoryOverlay.tsx`, `EventDetails.tsx`, `RSVPDrawer.tsx`, `WishesWall.tsx`,
`src/lib/sceneProgress.ts`, `src/lib/dataAdapter.ts`.
Use best-fit structure if existing repo differs; do not rewrite unrelated files.

## Definition of done
A locally runnable Next.js page with one shared Canvas, 5 readable sections, continuous reversible camera/prop animation driven by actual page scroll, placeholder objects until GLBs are supplied, responsive HTML controls, no fabricated event data, no broken links, no blocking JavaScript errors. Run lint/build/tests, list verified results and remaining missing assets. Do not state that a static illustration is real 3D.

## How to work
1. Inspect repo and existing files first.
2. Summarize implementation plan briefly.
3. Build minimum working 5-scene blockout using primitives before integrating complex GLBs.
4. Implement in small testable phases, verify each scene before next.
5. Maintain a progress checklist with completed, pending and blocked items.
6. Do not request paid APIs or hardcode tokens. Tripo asset creation is a separate manual step; this project only consumes exported GLBs.
