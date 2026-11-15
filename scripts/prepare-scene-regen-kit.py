"""Extract current viewpoints and prepare independent image/video prompt folders.

Source files and the active website are not modified. Layout references retain
their original content; freshly generated, reviewed input images are separate.
"""
from pathlib import Path
import hashlib
import html
import json
import shutil

import cv2
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'VEO3_PRODUCTION_KIT'
OUTPUT = KIT / '06_REGEN_SCENES'

DESCRIPTIONS = {
    'S01': 'Straight-on exterior of a modern six-storey university building at night. Symmetrical blue-gray facade, tall rectangular glass bays, a central transparent glass canopy, broad shallow entrance steps and a centered path with narrow grass strips. Directly behind the canopy is the SAME dark navy entrance portal seen in the corridor images: a rectangular opening with gently rounded upper corners and straight vertical sides. Dark navy starry sky, soft low clouds and restrained pale translucent ribbons only along the outer bottom edges. The entire building fits in the frame with the entrance on the central axis. All building signs are plain blank material surfaces.',
    'S02': 'Exact close exterior viewpoint at the university glass entrance, immediately beneath the transparent canopy. Black-blue horizontal canopy beams across the top, slender glass mullions on both sides, a broad curved navy portal with gently rounded rectangular upper corners, a narrow warm cream corridor beyond, dark reflective floor and closed dark double doors in the distance. Preserve the distinctive asymmetric curved ceiling on the left. The portal is part of the existing wall, not a separate semicircular arch standing in front of the entrance. Center the corridor and leave a clear line of sight to the closed far door.',
    'S03': 'The SAME narrow university corridor viewed one short step farther forward than the glass entrance. A curved navy entrance surround is visible near the foreground edges. Warm cream wall panels, restrained recessed warm ceiling strips, dark polished reflective floor, a softly lit small side opening on the left and the same closed dark double doors directly ahead. The camera is just inside the portal; never replace this space with a wide lobby. Keep the closed door centered and the vanishing point consistent with the entrance viewpoint.',
    'S04': 'The SAME narrow warm university corridor from its third forward viewpoint. The foreground portal has largely passed out of view. Asymmetric gently curved cream ceiling with thin recessed warm light strips, cream wall panels, a dark reflective floor, the same illuminated left-side recess and the same closed dark double door ahead, larger than in the second viewpoint. Straight-on forward axis, no camera turn and no new side passage. Sparse small atmosphere only, no broad bright ribbons across the middle.',
    'S05': 'The SAME narrow cream corridor at the fourth and final memory viewpoint, now quite close to the closed auditorium double doors. Keep the two existing dark door leaves and their fine rectangular border details clearly visible in the center. Warm recessed ceiling strips, softly curved ceiling, subtle illuminated openings at the side walls and dark polished floor. The existing double doors remain fully closed. This viewpoint already faces the door closely; there is no extra waiting position between this viewpoint and entering the auditorium.',
    'S07': 'Empty formal university graduation auditorium, straight-on central viewpoint toward a navy and gold stage. A few rows of dark audience chairs at the lower edges, a centered red carpet and shallow stage steps, blue curtains, restrained thin gold trim, a plain dark lectern to the side and symmetric white-blue flower arrangements. Warm professional stage lighting. The backdrop and all side panels are plain navy fabric or plain material: no banner text, slogans, university insignia, institutional emblems, graduation-cap emblems, numbers or pseudo-lettering. Keep the center of the stage empty for a separate website character.',
    'S08': 'Quiet empty blue-glass university lobby from a centered architectural viewpoint. Large blue glass walls, dark navy structural columns with restrained gold lines, luminous rounded rectangular ceiling light outlines, dark reflective tiled floor, two modest potted plants at the sides and a large CLOSED dark rectangular doorway directly in the center. Symmetrical depth and a clear central passage. All surfaces are plain architectural materials, without plaques, signs, brands or decorative text.',
    'S09': 'Empty blue and gold graduation reception setting adjoining the university lobby. A plain deep navy backdrop, elegant thin gold architectural borders, restrained blue and gold drapes high at the side edges, symmetric white and pale-blue flower arrangements and a polished dark floor with restrained reflections. Existing rounded ceiling lights continue the lobby style. Keep the large central backdrop completely plain, with no gold cap icon, laurel crest, lettering, dates, school insignia or sponsor branding. Calm welcoming final viewpoint with space for website forms and a separate 3D character.',
}

ROUTES = {
    'T01': 'Move forward from the exterior along the existing central approach, under the existing glass canopy, and stop at the exact close glass entrance viewpoint. There is only ONE navy curved rectangular portal, integrated in the doorway wall. Do not create a separate freestanding semicircular arch in front of it. Do not travel deeper than the supplied end viewpoint or invent an alternative lobby.',
    'T02': 'Move forward through the existing navy entrance portal into the SAME narrow warm corridor. Preserve the left ceiling curve, left-side illuminated recess, dark floor and closed far double door. The last frame is one deeper viewpoint along the same straight central axis. No room replacement, no turn and no door opening.',
    'T03': 'Continue forward a short distance within the SAME narrow cream corridor, with natural parallax in the existing side walls and reflected light. Approach the same closed dark double door without opening it. Keep the central axis and floor plan unchanged.',
    'T04': 'Continue along the SAME corridor to the fourth memory viewpoint, already close to and facing the closed auditorium door. Arrive at the exact supplied final viewpoint while the door remains shut. Do not add another waiting position after this one.',
    'T05': 'Starting already near the closed auditorium double doors, begin one forward camera move while those two existing door leaves swing open naturally on their hinges. Pass through that same opening into the auditorium and settle at the exact navy stage viewpoint. Reveal the new space through physical doorway occlusion. No stop at the threshold, no intermediate closed-door waiting shot and no second approach.',
    'T07': 'Leave the auditorium by a controlled backward dolly through its existing entrance, followed by one gentle continuous turn into the adjoining blue-glass lobby. Use doorway occlusion to connect the two spaces. Settle at the exact supplied lobby viewpoint with its central door closed. No teleport or image dissolve.',
    'T08': 'Move forward through the central lobby doorway as that existing doorway opens naturally, revealing the adjoining blue-and-gold reception setting. Follow the real opening and settle at the exact plain navy reception-backdrop viewpoint. Reveal by doorway occlusion; do not morph the lobby wall into a decorated backdrop.',
}

ATMOSPHERE = {
    'S01': 'Only very slow soft cloud drift at the extreme lower edges and a few tiny faint stars. The facade, canopy, stairs and all other architecture are perfectly stationary.',
    'S02': 'Only a few tiny faint dust motes near the outer edges. The glass, navy portal, corridor, reflections and closed far door stay registered. No large gold cloud or moving ribbon.',
    'S03': 'Only a few small, faint dust motes at the lateral edges. Keep the central doorway clear and all wall, floor and ceiling reflections nearly constant.',
    'S04': 'Only sparse faint dust near the side edges. No light ribbon crosses the central passage; illumination stays almost constant.',
    'S05': 'Only sparse tiny faint particles near the outer walls. The near auditorium door remains fully CLOSED and completely stationary throughout all eight seconds.',
    'S07': 'Only a few very faint dust particles at the outer stage edges. Existing stage lights remain steady, with no sweeping beams, flashes or falling confetti.',
    'S08': 'Only sparse tiny dust near the outer edges. Reflections and ceiling illumination remain almost constant; the central lobby door stays fully closed.',
    'S09': 'Only a few small faint luminous particles near the side drapes. The central backdrop stays clear, flowers and curtains remain still and all lights stay steady.',
}

NEGATIVE = ('logo, trademark, brand name, institutional insignia, text, numbers, captions, subtitles, '
            'pseudo-lettering, graphic badges, interface controls, upload icon, image-add icon, corner graphics, '
            'new on-image branding, people, portrait, mascot, graduation cap, cards, website buttons, '
            'camera shake, warped architecture, changing floor plan, strobe, exposure pumping, '
            'double exposure, morph, dissolve, teleport, reverse playback')


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + '\n', encoding='utf-8')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists():
        raise SystemExit('Regeneration folder already exists; refusing to overwrite user work.')
    plan = json.loads((KIT / '04_HANDOFF/asset-plan.json').read_text(encoding='utf-8'))
    sources = {}
    for ident, pattern in [('S01', 'Camera_approach*.mp4'), ('S02', 'Generating_architectural*.mp4')]:
        matches = list((ROOT/'data').glob(pattern))
        if len(matches) != 1:
            raise ValueError(f'Expected exactly one {ident} download')
        sources[ident] = matches[0]
    sources.update(S03=ROOT/'public/travel/scene-02/frame-085.webp',
                   S04=ROOT/'public/travel/scene-02/frame-103.webp',
                   S05=ROOT/'public/travel/scene-02/frame-120.webp',
                   S07=ROOT/'public/videos/scene-03-living.mp4',
                   S08=ROOT/'public/videos/scene-04-living.mp4',
                   S09=ROOT/'public/videos/scene-05-living.mp4')
    preview_video = dict(S02=sources['S02'], S03=ROOT/'public/videos/memory-2.mp4',
                         S04=ROOT/'public/videos/memory-3.mp4', S05=ROOT/'public/videos/door.mp4',
                         S07=sources['S07'], S08=sources['S08'], S09=sources['S09'])
    # Validate every source before making any folders.
    captures = {}
    for ident, path in sources.items():
        if path.suffix == '.mp4':
            cap = cv2.VideoCapture(str(path)); okay, image = cap.read(); cap.release()
            if not okay:
                raise ValueError('Cannot decode ' + str(path))
        else:
            image = cv2.imread(str(path))
        if image is None:
            raise ValueError('Cannot read ' + str(path))
        captures[ident] = image

    manifest = dict(schema_version=1, created_local_date='2026-11-15', timezone='Asia/Bangkok',
                    purpose='Independent scene regeneration with newly created unbranded reference images.',
                    source_images_are_clean=False, new_clean_images_generated=False,
                    old_source_marks_preserved=True, website_modified=False, scenes=[], transitions=[])
    cards, transitions, thumbnails = [], [], []
    for stop in plan['stops']:
        ident = stop['id']; slug = f"{ident}_{stop['slug']}"; folder = OUTPUT/'01_SCENES'/slug
        layout = folder/'00_CURRENT_PREVIEW/COMPOSITION_ONLY.png'
        layout.parent.mkdir(parents=True)
        if not cv2.imwrite(str(layout), captures[ident]):
            raise RuntimeError('Failed to write ' + str(layout))
        if ident in preview_video:
            shutil.copy2(preview_video[ident], folder/'00_CURRENT_PREVIEW/CURRENT_WITH_SOURCE_MARKS.mp4')
        write(folder/'00_CURRENT_PREVIEW/CHI_DE_DOI_CHIEU.txt',
              'Ảnh/video ở đây được trích từ đúng nền web đang dùng, giữ nguyên nội dung và các dấu có sẵn.\n'
              'Đây là mẫu xem bố cục, KHÔNG phải ảnh đầu vào mới đã sạch logo.\n'
              'Tạo ảnh mới bằng PROMPT_IMAGE_EN.txt, duyệt ảnh rồi đặt vào INPUT/REFERENCE.png.\n'
              + ('S01 hiện là ảnh đứng khớp khung đầu T01; chuyển động hạt là lớp web riêng.' if ident == 'S01' else 'Không upload bản video/ảnh còn dấu này làm đầu vào video mới.'))
        image_prompt = (
            'Create ONE brand-new high-quality architectural background image, 1920x1080, landscape 16:9. '
            'This is a fresh unbranded environment render, not a screenshot or a finished website mockup. '
            'If a composition reference is supplied, use its camera position and architecture only as a layout guide. '
            'Render actual architectural materials with plain unbranded surfaces.\n\n'
            + DESCRIPTIONS[ident] + '\n\n'
            'Style: refined photorealistic university architecture, deep navy blue and warm cream with restrained gold accents. '
            'Coherent perspective, realistic clean glass, stable straight structural lines, balanced exposure and a clear central passage. '
            'Keep the central vertical 32 percent legible for a portrait mobile crop. '
            'Empty environment only: no people, graduation cap, character, personal photographs, memory cards, UI or overlays. '
            'All letter-bearing or brand-bearing surfaces are plain material. No lettering, numbers, insignia, emblems, logos, '
            'corner graphics, badges, interface symbols or buttons anywhere in the rendered scene. '
            'Do not include a collage, title strip or frame border. Output one full-frame image.'
        )
        ambient_prompt = (
            'Use the approved INPUT/REFERENCE.png as BOTH first-frame and last-frame conditioning images. '
            'Generate one continuous 8-second silent architectural background plate, landscape 16:9.\n\n'
            'This is a still architectural photograph with only minimal atmosphere animated. Fixed tripod for ALL eight seconds. '
            'Constant focal length, focus, perspective, exposure and framing. Zero camera translation, zero zoom, zero pan, zero tilt. '
            'Every doorway, wall edge, glass mullion, ceiling beam and floor edge remains at the SAME pixel position from beginning to end. '
            'This clip contains NO arrival, approach or camera move.\n\n'
            + ATMOSPHERE[ident] + '\n\n'
            'Keep the approved plain unbranded reference surfaces unchanged. Add no lettering, logos, insignia, branding, '
            'corner graphics, badges, interface symbols, upload icons or subtitles. No people, character, cap, portrait or cards. '
            'Animate atmosphere gently FORWARD in time at native speed, with a subtle loop-compatible beginning and end. '
            'Never travel forward and then return to the reference. No dissolve back, crossfade, morph, ghosting, rewind, '
            'reverse motion, smoke fountain, large bright clouds, sweeping light ribbons, strobe or exposure pumping. '
            'The central passage remains clear for HTML content composited separately.'
        )
        write(folder/'PROMPT_IMAGE_EN.txt', image_prompt)
        write(folder/'PROMPT_AMBIENT_EN.txt', ambient_prompt)
        write(folder/'NEGATIVE_PROMPT_EN.txt', NEGATIVE + ', dolly, zoom, pan, tilt, orbit, camera drift, opening door')
        write(folder/'INPUT/DAT_ANH_MOI_VAO_DAY.txt', 'Đặt ảnh MỚI đã duyệt tại đây với tên REFERENCE.png.\n'
              'Yêu cầu: PNG thật, 16:9, tối thiểu 1280x720, ưu tiên 1920x1080.\n'
              'Không tự chép ảnh COMPOSITION_ONLY.png vào đây rồi coi đó là ảnh sạch.\n'
              'Ở Flow: chọn cùng ảnh REFERENCE.png cho ô ảnh đầu và ô ảnh cuối của nền đứng.')
        output_name = ident + '_AMBIENT.mp4'
        write(folder/'OUTPUT/DAT_VIDEO_VAO_DAY.txt', f'Lưu bản xuất gốc vào đây: {output_name}\nKhông crop, retime, đổi fps hay ghi đè lên video đang chạy web.')
        guide = (f'{ident} — {stop["title"]}\n\n'
                 '1. Xem ảnh/video trong 00_CURRENT_PREVIEW để hiểu vị trí camera. Các dấu nguồn vẫn còn trong mẫu đối chiếu.\n'
                 '2. Dùng PROMPT_IMAGE_EN.txt để tạo ảnh nền mới. Kiểm tra cả bốn góc, mặt tiền, biển hiệu và sân khấu; không chấp nhận icon/chữ/logo được vẽ trong cảnh.\n'
                 '3. Đặt ảnh mới đã duyệt vào INPUT/REFERENCE.png. Các cảnh cùng hành lang phải giữ cùng cửa, vật liệu và sơ đồ không gian.\n'
                 '4. Tạo video Frames: ảnh đầu = REFERENCE.png; ảnh cuối = cùng REFERENCE.png. Dán PROMPT_AMBIENT_EN.txt.\n'
                 '5. Chọn 16:9, 8 giây, x1, 1080p nếu có; tắt âm thanh nếu có. Không chọn chuyển động camera.\n'
                 '6. Xem toàn bộ video: kiến trúc đứng yên, cửa không tự mở, hạt nhẹ; không có đoạn cuối hòa về ảnh đầu. Kiểm tra chữ/logo/icon mới phát sinh.\n'
                 f'7. Lưu bản gốc vào OUTPUT/{output_name}.\n\n'
                 f'Lớp web riêng: {stop["content"]}\nBố cục: {stop["layout"]}\n'
                 'Chữ, ảnh cá nhân, nút, thẻ kỷ niệm và nón vẫn do web hiển thị; không gen chúng vào nền.\n\n'
                 'Prompt kiểm soát nội dung được vẽ, không bảo đảm ngăn nhãn do công cụ tự chèn khi xuất. '
                 'Nếu bản xuất có nhãn tự động, kiểm tra lựa chọn xuất chính thức của công cụ trước khi gen hàng loạt.\n')
        write(folder/'HUONG_DAN_VI.txt', guide)
        row = dict(id=ident, title=stop['title'], folder=folder.relative_to(OUTPUT).as_posix(),
                   composition_reference=layout.relative_to(OUTPUT).as_posix(),
                   composition_reference_is_clean=False, input=(folder/'INPUT/REFERENCE.png').relative_to(OUTPUT).as_posix(),
                   expected_output=(folder/'OUTPUT'/output_name).relative_to(OUTPUT).as_posix(),
                   image_prompt=(folder/'PROMPT_IMAGE_EN.txt').relative_to(OUTPUT).as_posix(),
                   video_prompt=(folder/'PROMPT_AMBIENT_EN.txt').relative_to(OUTPUT).as_posix(),
                   source=sources[ident].relative_to(ROOT).as_posix(), source_sha256=sha(sources[ident]),
                   source_frame=0 if sources[ident].suffix=='.mp4' else int(sources[ident].stem.split('-')[-1]),
                   dimensions=[captures[ident].shape[1],captures[ident].shape[0]])
        manifest['scenes'].append(row)
        relative = row['folder']
        cards.append(f'<article id="{ident}"><h2>{ident} · {html.escape(stop["title"])}</h2>'
                     f'<a href="{row["composition_reference"]}"><img src="{row["composition_reference"]}" alt="Bố cục {ident}"></a>'
                     '<p class="warning">Ảnh trích đối chiếu còn dấu nguồn — chưa phải INPUT mới.</p>'
                     f'<p><a href="{relative}/HUONG_DAN_VI.txt">Hướng dẫn cảnh</a> · <a href="{relative}/INPUT/">Thư mục INPUT</a> · <a href="{relative}/OUTPUT/">Thư mục OUTPUT</a></p>'
                     f'<details><summary>1. Prompt tạo ảnh nền mới</summary><pre>{html.escape(image_prompt)}</pre><button type="button">Copy prompt</button></details>'
                     f'<details><summary>2. Prompt video đứng yên</summary><pre>{html.escape(ambient_prompt)}</pre><button type="button">Copy prompt</button></details></article>')
        thumbnails.append((ident, stop['title'], captures[ident]))

    scene_lookup = {s['id']:s for s in manifest['scenes']}
    for move in plan['transitions']:
        ident, a, b = move['id'], move['source'], move['destination']
        folder = OUTPUT/'02_TRANSITIONS'/f'{ident}_{a}_TO_{b}'
        folder.mkdir(parents=True)
        for stop_id, filename in [(a,'FIRST_FRAME_COMPOSITION_ONLY.png'),(b,'LAST_FRAME_COMPOSITION_ONLY.png')]:
            shutil.copy2(OUTPUT/scene_lookup[stop_id]['composition_reference'],folder/filename)
        prompt = ('Supply INPUT/FIRST_FRAME.png and INPUT/LAST_FRAME.png in their respective first-frame and last-frame conditioning slots. '
                  'One continuous 8-second architectural camera shot, landscape 16:9, silent empty background plate. '
                  'These are approved NEW plain, unbranded reference images.\n\n'
                  + ROUTES[ident] + '\n\n'
                  'Use a controlled continuous dolly with a gentle acceleration and clear deceleration. '
                  'Begin the purposeful movement within the first 0.5 seconds, reach the exact final camera viewpoint by about 6 seconds, '
                  'and hold that viewpoint for the rest of the shot with minimal atmosphere. '
                  'Do not add an extra static waiting shot in the middle. Maintain spatial continuity and realistic occlusion; '
                  'do not substitute a different room or use a final reference-image overlay to fake the destination. '
                  'Keep existing structural edges coherent and illumination stable.\n\n'
                  'All plain unbranded surfaces stay plain. No text, logos, emblems, corner graphics, UI symbols, captions, people, '
                  'graduation cap, portrait or memory cards. Keep the center clear for separate website content. '
                  'No dissolve, crossfade, architectural morph, double exposure, hard cut, teleport, rewind or reverse playback.')
        write(folder/'PROMPT_TRANSITION_EN.txt',prompt)
        write(folder/'NEGATIVE_PROMPT_EN.txt',NEGATIVE + ', invented interior, extra entrance arch, final image overlay, camera overshoot')
        write(folder/'INPUT/DONG_BO_ANH_DAU_CUOI.txt',f'Ảnh đầu lấy từ {scene_lookup[a]["input"]}\n'
              f'Ảnh cuối lấy từ {scene_lookup[b]["input"]}\n'
              'Sau khi đã có các REFERENCE.png mới, chạy tools/sync_inputs.py để tạo FIRST_FRAME.png và LAST_FRAME.png ở đây.\n'
              'Không dùng hai file *_COMPOSITION_ONLY.png làm đầu vào gen video mới.')
        output_name=f'{ident}_{a}_TO_{b}.mp4'
        write(folder/'OUTPUT/DAT_VIDEO_VAO_DAY.txt',f'Lưu bản xuất gốc: {output_name}')
        write(folder/'HUONG_DAN_VI.txt',f'{ident}: {move["title"]}\n\n'
              f'1. Duyệt ảnh mới của {a} và {b} trước. Hai ảnh phải cùng kiến trúc/không gian như tuyến đã chốt.\n'
              '2. Chạy tools/sync_inputs.py; mở INPUT để lấy đúng hai ảnh đầu/cuối mới.\n'
              '3. Tạo video Frames với FIRST_FRAME.png ở ô đầu, LAST_FRAME.png ở ô cuối. Dán PROMPT_TRANSITION_EN.txt.\n'
              '4. Chọn 16:9, 8 giây, x1, ưu tiên 1080p. Xem toàn bộ đường đi; không chỉ xem ảnh đầu/cuối.\n'
              '5. Không chấp nhận phòng khác, vòm/cửa phát sinh hoặc đoạn cuối hòa hình về ảnh đích.\n'
              f'6. Lưu nguyên bản vào OUTPUT/{output_name}. Chưa tự tăng tốc hoặc cắt.\n\n'
              'Nhịp web khoảng 1–1.5 giây là phần xử lý sau khi duyệt nguồn; không phải yêu cầu gen một clip chỉ dài 1 giây.\n')
        row=dict(id=ident,source=a,destination=b,folder=folder.relative_to(OUTPUT).as_posix(),
                 first_input=(folder/'INPUT/FIRST_FRAME.png').relative_to(OUTPUT).as_posix(),
                 last_input=(folder/'INPUT/LAST_FRAME.png').relative_to(OUTPUT).as_posix(),
                 expected_output=(folder/'OUTPUT'/output_name).relative_to(OUTPUT).as_posix())
        manifest['transitions'].append(row)
        transitions.append(f'<article><h2>{ident} · {html.escape(move["title"])}</h2><p><a href="{row["folder"]}/HUONG_DAN_VI.txt">Hướng dẫn</a> · '
                           f'<a href="{row["folder"]}/INPUT/">Cặp ảnh mới</a> · <a href="{row["folder"]}/OUTPUT/">OUTPUT</a></p>'
                           f'<details><summary>Prompt đoạn chuyển</summary><pre>{html.escape(prompt)}</pre><button type="button">Copy prompt</button></details></article>')

    write(OUTPUT/'MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
    write(OUTPUT/'00_DOC_TRUOC.txt',
          'MỞ START_HERE.html để xem từng cảnh và copy prompt.\n\n'
          'Bộ mới: 8 nền đứng yên + 7 đoạn chuyển. S06/T06 đã bỏ; Năm 4 -> mở cửa -> hội trường trong một chặng.\n'
          'Ưu tiên: tạo ảnh mới S01/S02 cùng một kiến trúc -> gen S02_AMBIENT và T01 -> xem thử -> tiếp tục S03/T02.\n'
          'Nếu cần nền mở đầu có mây chuyển động, gen thêm S01_AMBIENT; web hiện giữ đúng khung đầu T01 ở màn thiệp mời.\n\n'
          'MỖI CẢNH / 01_SCENES:\n'
          '- 00_CURRENT_PREVIEW: ảnh trích và video hiện tại để đối chiếu, giữ nguyên cả dấu nguồn.\n'
          '- PROMPT_IMAGE_EN.txt: tạo ảnh môi trường MỚI, bề mặt không chữ/logo/icon.\n'
          '- INPUT/REFERENCE.png: bạn đặt ảnh mới đã duyệt, không có sẵn trong bộ này.\n'
          '- PROMPT_AMBIENT_EN.txt: dùng cùng REFERENCE.png ở đầu/cuối, camera đứng yên đủ 8 giây.\n'
          '- OUTPUT: lưu bản xuất gốc đúng tên.\n\n'
          'ĐOẠN NỐI / 02_TRANSITIONS: tạo sau khi có ảnh mới ở hai cảnh liên quan.\n'
          'Chạy python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/sync_inputs.py để chép đúng các cặp ảnh mới đã có.\n'
          'Helper chỉ ghi bên trong bộ tái tạo này, không thay video web đang dùng.\n\n'
          'Icon/chữ/logo đã nằm trong ảnh cũ có thể bị giữ nguyên khi gen video: cần ảnh đầu vào mới được duyệt trước.\n'
          'Prompt không bảo đảm ngăn nhãn do nền tảng tự chèn khi xuất. Nếu có nhãn tự động, kiểm tra lựa chọn xuất chính thức của công cụ trước khi gen hàng loạt.\n'
          'Nội dung web (tên, ảnh riêng, card, nón 3D, form) vẫn là lớp riêng, không gen vào nền.\n'
          'Bộ này chưa tạo ảnh/video mới và không tự chứng nhận các ảnh trích là sạch.\n')
    sync_template=Path(__file__).with_name('scene-regen-sync-inputs.py')
    (OUTPUT/'tools').mkdir(exist_ok=True)
    shutil.copy2(sync_template,OUTPUT/'tools/sync_inputs.py')
    write(OUTPUT/'DONG_BO_INPUT.bat','@echo off\ncd /d "%~dp0"\npython tools\\sync_inputs.py\npause')
    write(OUTPUT/'MO_HUONG_DAN.bat','@echo off\nstart "" "%~dp0START_HERE.html"')
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',19)
    sheet=Image.new('RGB',(1600,2*265),'#0b1829');draw=ImageDraw.Draw(sheet)
    for i,(ident,title,image) in enumerate(thumbnails):
        x=(i%4)*400;y=(i//4)*265
        sheet.paste(Image.fromarray(cv2.cvtColor(image,cv2.COLOR_BGR2RGB)).resize((400,225)),(x,y))
        draw.text((x+8,y+232),f'{ident} · {title}',font=font,fill='#ecd6a7')
    sheet.save(OUTPUT/'SCENE_INDEX.jpg',quality=91)
    document='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bộ tái tạo từng cảnh</title><style>body{margin:0;background:#0b1829;color:#e9eef6;font:16px/1.6 system-ui}main{max-width:1180px;margin:auto;padding:32px 20px}h1,h2{color:#ecd6a7}h1{font-size:32px}h2{font-size:20px}a{color:#b9d5ff}header,article{border:1px solid #34475f;padding:22px;border-radius:12px;background:#102239;margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}article{margin:0}img{width:100%;height:auto;border-radius:6px}.warning{color:#f4cd93}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 ui-monospace;background:#081421;padding:15px;border-radius:6px}button{background:#ecd6a7;color:#11223a;border:0;padding:9px 15px;border-radius:5px;cursor:pointer}summary{cursor:pointer;padding:12px 0}.small{font-size:14px;color:#aab9cc}nav a{margin-right:15px}</style>
<main><header><h1>Tạo lại từng cảnh · ảnh mới + video mới</h1><p>8 nền camera đứng yên và 7 đoạn nối. Chữ, ảnh riêng, nón 3D và nút do web hiển thị.</p>
<p class="warning">Ảnh trích dưới đây còn dấu nguồn, chỉ để xem bố cục. Chưa có ảnh INPUT mới được tạo sẵn.</p>
<ol><li>Mở prompt ảnh trong từng cảnh → tạo và duyệt ảnh mới không có chữ/logo/icon trong nội dung.</li><li>Lưu ảnh vào <b>INPUT/REFERENCE.png</b> của cảnh tương ứng.</li><li>Gen nền đứng yên: cùng ảnh đó ở cả ô đầu và ô cuối, 8 giây, 16:9, x1.</li><li>Chạy <b>DONG_BO_INPUT.bat</b> sau khi có cặp ảnh mới → tạo các đoạn chuyển.</li><li>Lưu MP4 gốc đúng tên trong OUTPUT rồi gửi lại để kiểm tra, tối ưu và thay vào web.</li></ol>
<p>Bắt đầu: S01/S02 → S02_AMBIENT + T01 → S03 + T02. Chưa gen hàng loạt trước khi duyệt đoạn thử.</p>
<p class="small">Prompt không bảo đảm ngăn nhãn nền tảng tự chèn khi xuất. Kiểm tra bản xuất chính thức trước khi tạo hàng loạt. S06/T06 không còn dùng.</p>
<nav><a href="00_DOC_TRUOC.txt">Hướng dẫn đầy đủ</a><a href="SCENE_INDEX.jpg">Xem toàn bộ cảnh</a><a href="MANIFEST.json">Danh sách tệp và nguồn trích</a><a href="#moves">Các đoạn chuyển</a></nav></header>
<h2>1. Từng cảnh đứng yên</h2><div class="grid">SCENES</div><h2 id="moves">2. Đoạn chuyển giữa hai ảnh mới</h2><div class="grid">MOVES</div></main>
<script>document.querySelectorAll('button').forEach(b=>b.onclick=async()=>{const text=b.parentElement.querySelector('pre').textContent;try{await navigator.clipboard.writeText(text)}catch(e){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}b.textContent='Đã copy';setTimeout(()=>b.textContent='Copy prompt',1500)});</script></html>'''
    write(OUTPUT/'START_HERE.html',document.replace('SCENES',''.join(cards)).replace('MOVES',''.join(transitions)))
    print(json.dumps(dict(folder=str(OUTPUT),scenes=len(manifest['scenes']),transitions=len(manifest['transitions']),new_clean_inputs_generated=0),ensure_ascii=True))


if __name__ == '__main__':
    main()
