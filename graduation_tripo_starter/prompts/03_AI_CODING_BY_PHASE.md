# PROMPTS TUNG GIAI DOAN - GUI LAN LUOT CHO AI CODING AGENT

## PROMPT 0 - PROJECT SKELETON

Implement phase 0 only. Inspect the existing repo first. Initialize/repair a Next.js App Router + TypeScript project using React Three Fiber, drei, GSAP and ScrollTrigger. Create one persistent canvas and a scroll driver whose normalized value p in [0,1] is derived from real scroll position. Establish five scene slots with configurable ranges 0-.18, .18-.42, .42-.60, .60-.80 and .80-1. Create procedural placeholder objects and a debug panel that shows progress, active scene and loaded assets. Add generic invitation overlay. Verify desktop and mobile scroll and reverse scrub. Run build and report files changed. Do not import unavailable GLB files.

Acceptance: page launches; 5 distinct blocking scenes visible; progress indicator and back-scroll work; no runtime errors.

## PROMPT 1 - ASSET PIPELINE & LOADER

Implement phase 1 only. Add an asset registry for graduate, cap, envelope, diploma, campus, gate, stage and podium. Build GLB loader with graceful fallback for each absent asset, asset scaling/alignment, origin/pivot normalization and dev-only clip inspector. Create a diagnostic route or component that can show each model at 0/90/180/270 degrees and list skinned meshes, bones and animation clips. Preserve canvas state between scenes and reuse shared model data. Do not fabricate existing files. Add README explaining where to place each exported Tripo GLB.

Acceptance: GLB files can be added one by one without code rewrite; missing ones display clearly labeled placeholder.

## PROMPT 2 - HERO: ENVELOPE + CHIBI + CAP

Implement scene 01 only, range 0-.18. Direction: bright blue sky, layered gentle clouds, navy/white/gold. At 0-.04 camera pushes through cloud layers; at .04-.09 an ivory envelope opens with a separately hinged flap and an HTML invitation card emerges; at .09-.14 hero content pauses, shows public invitation, graduate's name, faculty and event data placeholders, with chibi waving; at .14-.18 a single gold-tassel cap flies toward the camera and covers center screen as transition. Use smooth interpolation and spring-like easing without overshoot. Maintain readable CTA button and skip-intro. Cap and envelope must have independent transforms. When scroll reverses, close envelope and return cap exactly. Do not inject guest-specific names or invented event date.

Acceptance: envelope hinge works, cap visually connects to next scene, hero readable on mobile, reverse scroll works.

## PROMPT 3 - CAMPUS + MEMORIES

Implement scene 02 only, range .18-.42. Use the attached original campus facade photo for a layered 2.5D backdrop by default, unless a valid multi-view campus GLB is present; never imply a perfect architectural scan. The same graduation cap leads the viewer toward a stylized campus gate. Four HTML/CSS polaroid cards float along the camera path with alternating depth, short configurable memory captions and image placeholders. At .18-.23 reveal gate; .23-.34 travel past photos; .34-.39 pause on fourth photo; .39-.42 make final card expand and transition into a navy/gold auditorium look. Subtle particles and gold trail only. No invented real memory photos.

Acceptance: cards remain readable, depth effect is visible, photo-to-stage bridge has no hard cut, mobile parallax toned down.

## PROMPT 4 - CEREMONY: CHIBI ANIMATION + CAP THROW

Implement scene 03 only, range .42-.60. Build light 3D stage from floor/steps/curtains/podium and instanced chairs, with a configurable lightweight `stage_shell.glb` override. Add a rigged graduate model when available, otherwise use a simple procedural character placeholder. Inspect animation clips; do not assume names. Implement deterministic animation seeking: .42-.47 reveal stage and lights; .47-.53 walk to center and lift diploma; .53-.57 celebrate and throw single cap; .57-.60 cap grows in camera view to create masked transition. Rigged character and independent cap/diploma must not be a single fused mesh. Backward scroll returns the hat smoothly to the character; avoid duplicate visible hats. Do not automatically play a throw-cap clip out of sync with scroll.

Acceptance: event works with and without rigged character; no jerky camera, cap is reversible, no missing textures.

## PROMPT 5 - SCHEDULE + VENUE

Implement scene 04 only, range .60-.80. After cap occlusion, gently brighten scene and reveal clear HTML event-information cards. Add date/weekday and agenda from `src/config/event.ts`, not hardcoded sample times. Add venue card and Google Maps lazy-load modal; route button opens a supplied external Maps URL. Add ICS calendar download and optionally Google Calendar URL only when valid ISO start/end times and address are set. When data missing, present "Đang cập nhật" and disable route/calendar actions with explanation. Keep camera mostly still while people read. At .77-.80 the event card scales toward a paper-invitation shape leading to RSVP.

Acceptance: no fake event info, mobile-friendly buttons, map does not steal scroll unexpectedly.

## PROMPT 6 - RSVP + WISHES

Implement scene 05 only, range .80-1.00. Build accessible RSVP drawer with name, yes/no, guest count, optional message; build wishes list + submission modal (text + optional image). For MVP, separate UI from `dataAdapter` and show demo-only/local data state honestly; do NOT claim stored/submitted to a server before backend exists. Use optimistic updates only when backend response confirms success. Animate floating wish cards subtly with CSS transforms, not expensive 3D geometries. Gradually bring chibi back into view for a final wave at .94-1.00. Provide keyboard focus trap, closing with Escape, ARIA labels, responsive form.

Acceptance: drawer opens/closes, form validation works, no fake persistence; last scene has a visually satisfying end state.

## PROMPT 7 - FINAL POLISH + DEPLOY QA

Review all 5 scenes and transitions. Eliminate camera discontinuities and transform snapping; ensure fast scroll, backscroll and touch gestures seek correctly. Test WebGL unsupported and reduced-motion paths, optimize textures/meshes and lazy loading, cap DPR and scene complexity on mobile. Check correct colors navy #10264A, IUH blue #2469BC, white #F4F7FC, gold #F0C66D. Add production metadata, responsive nav, intro skip, sections deep-link, loading/progress state. Run lint, typecheck, build and inspect network payload on desktop/mobile. Provide a clear completion report with tested flows, unresolved asset needs and deployment steps for Vercel. Don't claim tests passed without logs.

Acceptance: no major runtime errors; accessible content remains usable without 3D; deployment ready.
