# PROMPTS TAO ANH DAU VAO CHO TRIPO AI

Can phan biet: prompt duoi day danh cho CONG CU TAO ANH (image-to-image/text-to-image). Khi da co anh sach, upload no vao Tripo Image-to-3D. Trong Multi-view, upload tung anh goc rieng, khong ghep 4 goc vao cung mot anh.

## STYLE LOCK - DAN VAO CUOI MOI PROMPT TAO ANH

`Single isolated subject, centered and fully visible, occupies 75-85% of frame, clean neutral light-gray studio background, soft even diffuse lighting, 3D stylized collectible aesthetic, clean readable silhouette, no scenic backdrop, no floor scenery, no clouds, no gold light trails, no particles, no titles, no watermark, no text, no extra objects, no duplicate subjects, no cropped edges, sharp details, simple physically plausible materials.`

## A01. CHIBI (uu tien cao nhat)
Anh tham chieu: `references/01_chibi_original_use_for_style.png` (can su dung image-to-image giu danh tinh thiet ke).

Prompt tao anh front A-pose:
`Use the attached original chibi graduate as the strict character identity and costume reference. Produce ONE full-body 3D stylized chibi boy in a neutral A-pose for rigging, arms slightly away from the torso, open empty hands, feet shoulder-width apart, facing exactly forward. Keep identical face proportions, shiny dark eyes, black center-parted hair, cheerful approachable expression, black graduation gown with the same royal-blue trim and yellow V-shaped stole, black tie, black pants and black-and-white sneakers. NO graduation cap on his head; NO diploma in either hand; remove all floating objects. The body, elbows, wrist joints, legs and shoes must be clearly separated and visible. [STYLE LOCK]`

Generate at least one side view and one back view by changing ONLY camera angle; all views must preserve same proportions, pose, attire and lighting. In Tripo choose Multi-view 2-4 images, inspect back. Save `graduate_rigged.fbx` then Blender -> `graduate.glb`.

## A02. MU TOT NGHIEP (model tach rieng de bay)
Anh tham chieu phong cach: `concepts/01_invitation_concept_NOT_Tripo_input.png` (chi lay thiet ke mu).

`One standalone graduation mortarboard cap, deep midnight navy black fabric, clean square flat top board, structured round headband, narrow royal-blue edge piping, a single luxurious golden tassel attached at the top right, elegant stylized 3D collectible prop, three-quarter front view, entire cap and tassel fully visible, not worn by a person. [STYLE LOCK]`

Output `cap.glb`. Tassel can be static or separate for simple sway in Blender.

## A03. PHONG BI - NEN TACH MODEL/BAT CANH
Anh tham chieu: `concepts/01_invitation_concept_NOT_Tripo_input.png`.

`One elegant cream ivory graduation envelope pocket, rigid folded paper, dark navy ribbon edging and a small round gold wax seal with a simple laurel motif, symmetrical clean geometric shape, no postcard inserted, front three-quarter view, matte premium paper, accessible open top, the triangular opening flap separated or omitted to allow a moving hinge later. [STYLE LOCK]`

Output optional `envelope_body.glb`. Tao `envelope_flap` bang tam plane/polygon co pivot tai mep tren trong Three.js/Blender; `invitation_card` bang HTML/CSS la cach de hien text ro net. Tripo thuong gop cac bo phan, khong nen ky vong mot mesh phong bi tu dong mo nap.

## A04. CUON BANG TOT NGHIEP
`One single rolled ivory parchment diploma scroll tied with one satin golden-yellow bow, both rolled paper ends clearly visible, smooth stylized premium 3D prop, horizontal three-quarter view, no hands, no writing, no table. [STYLE LOCK]`

Output `diploma.glb`, pivot chinh giua. Attach vao bone ban tay khi animation.

## A05. TOA NHA TRUONG
Anh tham chieu: `references/02_campus_photo_original.png`. Anh goc chup tu duoi len va bi cay che nen KHONG the suy ra 3D chinh xac.

Neu muon tao model phoi canh:
`Using the attached real campus building reference, isolate ONE modern university building with a cool light-blue vertical metal-panel facade, large central blue-tinted glass curtain wall, narrow repeated dark windows, black roof edge, approximately rectangular multi-story massing. Front orthographic architectural view with minimal perspective, whole building visible including its ground-floor base, no trees covering facade, no sky, no neighboring buildings, no signage or invented logos, clean studio architectural model presentation. [STYLE LOCK]`

Output optional `campus_facade.glb`. Prefer 2.5D photo for documentary accuracy; use multi-view only if have real side/back photos. Do not fabricate official architectural details.

## A06. CONG TRUONG / PORTAL
`One modern minimal university entrance gate architectural prop with two tall rectangular light-blue stone/concrete pillars and a simple horizontal lintel with subtle navy accent trims, university campus aesthetic matching blue glass architecture, clean symmetrical structure, straight front view, no words, no logos, no surrounding street, no characters. [STYLE LOCK]`

Output `campus_gate.glb`. Gate is a cinematic symbol, not a claim about the real entrance.

## A07. BUC TRAO BANG
`One elegant graduation ceremony podium lectern, polished warm walnut wood with navy front panel and understated brushed-gold edge trims, simple clean rectangular academic design, no microphone, no text, no crest or logo, three-quarter front view. [STYLE LOCK]`

Output `podium.glb`.

## A08. SAN KHAU / HOI TRUONG - MODEL MODULAR
Use `concepts/03_graduation_stage_concept_NOT_Tripo_input.png` for visual styling only.

`One isolated low-poly stylized graduation auditorium stage module: shallow stepped platform, navy backdrop, symmetrical royal-blue curtains, warm gold trim, central presentation area, no people, no chairs, no graduation caps, no text, no confetti, clear front three-quarter view, suitable as a modular environment asset for a lightweight real-time website. [STYLE LOCK]`

Output `stage_shell.glb` if desired; even better: code the stage steps, floor, curtain planes and instanced chairs as reusable Three.js geometry. No need generate giant auditorium with millions of polygons.

## A09. TAI NGUYEN KHONG CAN TRIPO
- `clouds`: 2D transparent cloud image layers, WebGL planes or lightweight procedural shader.
- `memory_photo_01..04`: actual uploaded student memories, image planes/HTML cards.
- `invitation_card`: HTML/CSS with readable text, separate from 3D envelope.
- `schedule`, `map`, `rsvp`, `wishes`: HTML responsive UI; no GLB.
- `golden_ribbon_trail`: curved mesh/tube shader in R3F, not a Tripo model.

## TEXT TO 3D FALLBACK
Tripo co Text-to-3D. Neu khong the tao anh tham chieu, co the dung truc tiep prompt A02/A04/A06/A07, nhung nen xoa cac cau nhu `attached reference` va `[STYLE LOCK]`. Phuong an image-to-3d thuong de kiem soat thiet ke dong bo hon.
