"""Create the local Veo production handoff from the user's source videos.

Usage: python scripts/build-veo-kit.py --source <extracted Graduation_Videos.rar>
Existing reference images and prompts are preserved. No generation API is called.
"""
import argparse
import hashlib
import html
import json
import shutil
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, default=Path('VEO3_PRODUCTION_KIT'))
parser.add_argument('--refresh-door-flow', action='store_true', help='Refresh generated S05/T04 text after a backed-up door-flow migration.')
args = parser.parse_args()
root = args.output.resolve()
root.mkdir(parents=True, exist_ok=True)

def write(path, value, preserve=False):
    path = root / path
    path.parent.mkdir(parents=True, exist_ok=True)
    refresh = args.refresh_door_flow and any(str(path.relative_to(root)).replace('\\','/').startswith(prefix) for prefix in ['01_STOPS/S05_MEMORY_YEAR_4/', '02_TRANSITIONS/T04_S04_TO_S05/'])
    if preserve and path.exists() and not refresh:
        return
    path.write_text(value.rstrip() + '\n', encoding='utf-8')

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

stops = [
    dict(id='S01', slug='INVITATION', title='Thiệp mời trước trường', scene=2, frame=0, content='Lời mời và khung ảnh thật của Minh.', layout='Chữ bên trái, khung ảnh bên phải; để giữa trống cho lối tiến vào trường.', motion='Very slow soft cloud drift at the lower edges; sparse warm gold motes; a restrained flowing light ribbon outside the central building facade.', cap='Nón lơ lửng phía trên khung ảnh, sau đó bay về lối vào.', role='hero'),
    dict(id='S02', slug='MEMORY_YEAR_1', title='Năm 1 — bước chân đầu tiên', scene=2, frame=59, content='Một card Năm 1, dùng ảnh cá nhân riêng.', layout='Card trái trên desktop; card dưới trên mobile. Giữ lối vào ở giữa thông thoáng.', motion='Sparse suspended gold dust and delicate moving light reflections in the side glass; quiet atmospheric motion, never entering deeper into the corridor.', cap='Nón dẫn về phía trước, tránh vùng card trái.', role='memory'),
    dict(id='S03', slug='MEMORY_YEAR_2', title='Năm 2 — đồ án và bạn bè', scene=2, frame=85, content='Một card Năm 2; không hiển thị đồng thời cả bốn card.', layout='Card bên phải, cửa và hướng đi ở giữa.', motion='A few slow golden particles drifting across the corridor edges; gentle changes in existing reflected light on the floor, with stationary architecture.', cap='Nón bay về phía đối diện card phải.', role='memory'),
    dict(id='S04', slug='MEMORY_YEAR_3', title='Năm 3 — thực tập', scene=2, frame=103, content='Một card Năm 3 và câu chuyện thực tập.', layout='Card trái, nhấn chiều sâu của hành lang phía sau.', motion='A restrained translucent gold light current along the side wall and sparse drifting dust; all door and wall edges remain perfectly stationary.', cap='Nón đi dọc trục hành lang, không lướt qua chữ.', role='memory'),
    dict(id='S05', slug='MEMORY_YEAR_4', title='Năm 4 — gần cửa hội trường', scene=2, frame=120, content='Card Năm 4 khép lại hành trình; ngay trong chặng này đã gần thấy cửa. Cuộn thêm một nhịp là cửa mở và đi vào hội trường.', layout='Card phải; cửa đóng hiện rõ ở trung tâm phía sau. Không có cảnh đứng chờ hay câu nhắc riêng trước cửa.', motion='Subtle warm celebratory sparkles at the outer margins and soft existing light movement on the floor. The visible auditorium door is close ahead, fully closed and completely still until a separate transition is triggered.', cap='Nón hướng về cửa; cùng nhịp cuộn rời card, nón bay xuyên cửa vào cảnh hội trường.', role='memory'),
    dict(id='S07', slug='CEREMONY', title='Hội trường và khoảnh khắc tốt nghiệp', scene=3, frame=189, content='Tiêu đề ngắn; chibi 3D nếu giữ sẽ là lớp riêng.', layout='Để trung tâm sân khấu trống cho nhân vật 3D; chữ ở vùng an toàn.', motion='Soft existing stage light beams and sparse elegant dust motes; a stable stage, podium, curtains and all existing signage, without strobing or a confetti storm.', cap='Nón bay lên cao bên sân khấu, không nhân đôi với video.', role='ceremony'),
    dict(id='S08', slug='EVENT_DETAILS', title='Sảnh — thông tin buổi lễ', scene=4, frame=189, content='Lịch, địa điểm và chỉ đường bằng HTML thật.', layout='Khối thông tin gọn; nền yên để đọc và thao tác.', motion='Very restrained moving daylight reflections on the existing glass and polished floor, with a few faint dust particles; quiet formal lighting.', cap='Nón nhỏ ở mép trên, không bay qua form hay bản đồ.', role='event'),
    dict(id='S09', slug='WISHES_RSVP', title='Lưu bút, RSVP và cảm ơn', scene=5, frame=189, content='Một luồng gửi lời chúc/xác nhận; cảm ơn cá nhân.', layout='Ưu tiên form, không ép cuộn cảnh khi đang gõ hoặc đọc.', motion='A few slow luminous gold particles and a soft existing ceiling-light shimmer; a warm welcoming end scene with stable architecture and exposure.', cap='Nón hạ nhẹ và ở yên, chuyển động rất nhỏ.', role='wishes'),
]

style = ('A formal, premium Vietnamese university graduation invitation environment. '
         'Preserve the supplied architectural identity, framing, materials, perspective, navy-blue and warm-gold palette. '
         'This is an empty background plate for an interactive website. All portraits, memory photographs, captions, '
         'buttons, 3D characters and the traveling graduation cap will be composited separately by the website. '
         'Keep the central vertical 32 percent visually legible for a mobile portrait crop. '
         'Keep existing architectural lettering fixed; introduce no new lettering or decorations. '
         'Silent visual plate; consistent exposure, restrained highlights, clean edges, a dignified atmosphere.')
negative_shared = ('people, crowd, portrait, graduate character, chibi, mascot, flying graduation cap, floating diploma, '
                   'UI, interface, captions, subtitles, buttons, new text, new signage, added watermark, '
                   'warped walls, bending straight lines, distorted architecture, changing floor plan, '
                   'exposure pumping, flashing, strobe, handheld shake, rolling horizon, '
                   'scene replacement, dissolve transition, jump cut, architectural morphing')

tasks = []
for stop in stops:
    stop['folder'] = f"01_STOPS/{stop['id']}_{stop['slug']}"
    stop['reference'] = stop['folder'] + '/REFERENCE.png'
    target = root / stop['reference']
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        cap = cv2.VideoCapture(str(args.source / f"scene-{stop['scene']:02}.mp4"))
        cap.set(cv2.CAP_PROP_POS_FRAMES, stop['frame'])
        okay, frame = cap.read()
        cap.release()
        if not okay:
            raise RuntimeError(f"Cannot extract {stop['id']}")
        cv2.imwrite(str(target), frame)
    stop['reference_sha256'] = digest(target)
    stop['ambient_output'] = stop['folder'] + f"/OUTPUT/{stop['id']}_AMBIENT.mp4"
    prompt = (f"8-second locked-off background shot. Use REFERENCE.png as the exact first frame. "
              f"Where first/last-frame conditioning is available, use the SAME image as the final frame. "
              f"{style}\n\n"
              f"Camera: fixed tripod at the supplied optical center and lens setting for all eight seconds. "
              f"Architecture, perspective, framing and focus are stationary. Animate ONLY the atmosphere: {stop['motion']} "
              f"Atmospheric elements move smoothly forward in time at a calm natural speed. "
              f"Compose a cyclic atmospheric motion whose final state joins the first; keep the environment alive throughout, "
              f"rather than moving the camera or freezing most of the shot. Hold the same geometry and door state at every frame. "
              f"The floor, walls, ceiling, building and signage remain registered to the first frame. "
              f"Maintain enough clean negative space for later HTML overlays.\n\n"
              f"{('The far door must stay CLOSED. It never opens in this ambient clip. Door opening belongs to a separate transition.' if stop['role'] in ['door','memory'] else '')}")
    negative = negative_shared + ', dolly, zoom, pan, tilt, orbit, camera drift, forward camera travel, backward camera travel, reversed motion, ping-pong playback'
    write(stop['folder']+'/PROMPT_AMBIENT_EN.txt', prompt, preserve=True)
    write(stop['folder']+'/NEGATIVE_PROMPT.txt', negative, preserve=True)
    write(stop['folder']+'/HUONG_DAN.txt', f"{stop['id']} — {stop['title']}\n\n"
          f"1. Ảnh đầu: REFERENCE.png. Nếu công cụ có ô ảnh cuối: chọn cùng REFERENCE.png.\n"
          f"2. Dán PROMPT_AMBIENT_EN.txt. Negative prompt dùng riêng nếu công cụ có trường tương ứng.\n"
          f"3. Chọn 16:9, nguồn 1080p nếu có, thời lượng 8 giây; tắt âm thanh nếu có.\n"
          f"4. Đây là camera ĐỨNG YÊN; chuyển động chỉ ở môi trường. Không gen nón/nhân vật/card.\n"
          f"5. Lưu bản xuất gốc vào OUTPUT/{stop['id']}_AMBIENT.mp4.\n\n"
          f"Nội dung web riêng: {stop['content']}\nBố cục web: {stop['layout']}\nVai trò nón: {stop['cap']}\n\n"
          f"Ảnh trích: scene-{stop['scene']:02}.mp4, frame {stop['frame']}, t={stop['frame']/24:.6f}s, nguồn gốc 1920×1080.\n"
          f"Ảnh có thể còn chữ/logo/chi tiết AI từ video nguồn. Duyệt ảnh TRƯỚC KHI gen; prompt không tự sửa ảnh tham chiếu.\n"
          f"Nếu thay REFERENCE.png: chạy tools/sync_references.py trước khi gen các đoạn nối.\n", preserve=True)
    write(stop['folder']+'/OUTPUT/DAT_VIDEO_VAO_DAY.txt', f"Đặt video gốc tại đây: {stop['id']}_AMBIENT.mp4. Không đặt lại ảnh nguồn vào OUTPUT.", preserve=True)
    tasks.append(dict(id=stop['id']+'_AMBIENT', kind='ambient', stop=stop['id'], prompt=stop['folder']+'/PROMPT_AMBIENT_EN.txt',
                      first_frame=stop['reference'], last_frame=stop['reference'], output=stop['ambient_output'],
                      preferred_generation_seconds=8, desired_playback='native forward loop at 1x', pilot=stop['id'] in ['S01','S02']))

moves = [
    ('Approach the existing entrance on the central axis from the exterior, pass under its glass canopy and arrive just inside at the first memory viewpoint.', 'Thiệp mời → vào trường → Năm 1'),
    ('Dolly forward along the SAME existing corridor from the first memory viewpoint to the second, with perceptible parallax in the side walls and glass.', 'Năm 1 → Năm 2'),
    ('Continue forward down the SAME corridor to the third memory viewpoint. Keep the forward vanishing point stable; side architecture passes naturally.', 'Năm 2 → Năm 3'),
    ('Continue along the SAME corridor to the fourth memory viewpoint, already near and clearly facing the closed auditorium door. Arrive at this final memory position with the door still closed; do not add another waiting position between this viewpoint and the door.', 'Năm 3 → Năm 4, đã gần thấy cửa'),
    ('From the supplied final-memory viewpoint, with the auditorium door already visible close ahead, perform ONE uninterrupted forward move. As forward travel begins, the two existing door leaves immediately start to swing open naturally on their hinges. Continue through the opening into the auditorium and settle at the supplied stage viewpoint. Do not stop or pause at the door threshold, do not add an intermediate closed-door waiting shot, and do not require another move to reveal the hall. Reveal the new space by physical doorway occlusion, never by morphing the door into a stage.', 'Năm 4 → một nhịp cuộn, cửa mở → hội trường'),
    ('Leave the auditorium with one smooth backward dolly away from the stage through its existing entrance, then follow a gentle continuous turn into the adjoining blue glass lobby to match the final viewpoint. Use a real doorway occlusion for the change of space, not an architectural dissolve or a teleport.', 'Hội trường → sảnh thông tin'),
    ('Dolly forward through the central lobby doorway as its existing door opens naturally, revealing the adjoining blue-and-gold wishes room. Continue to the supplied final position and settle there.', 'Sảnh → lưu bút và RSVP'),
]
transitions = []
for index, (route, title) in enumerate(moves):
    a, b = stops[index:index+2]
    # Preserve established IDs of unaffected assets; S06 and T06 are retired.
    ident = ['T01','T02','T03','T04','T05','T07','T08'][index]
    folder = f"02_TRANSITIONS/{ident}_{a['id']}_TO_{b['id']}"
    (root/folder).mkdir(parents=True, exist_ok=True)
    for source, name in [(a, 'FIRST_FRAME.png'), (b, 'LAST_FRAME.png')]:
        target = root/folder/name
        if not target.exists(): shutil.copy2(root/source['reference'], target)
    prompt = (f"One continuous 8-second architectural camera shot. FIRST_FRAME.png is the exact initial image and "
              f"LAST_FRAME.png is the exact final image, supplied in the model's first-frame and last-frame inputs. {style}\n\n"
              f"Timing: 0.0–2.5 seconds hold the first viewpoint with subtle ambient motion; 2.5–4.5 seconds execute "
              f"one purposeful camera move; 4.5–8.0 seconds stay at the final viewpoint with subtle ambient motion. "
              f"The camera travel is concentrated into that central 2-second interval so it can be trimmed for a responsive website. "
              f"Route: {route}\n\n"
              f"Movement: a controlled cinematic dolly with gentle acceleration, a clear forward displacement "
              f"(or the explicitly requested exit route), and an elegant deceleration to zero velocity. "
              f"Preserve architectural geometry and spatial continuity; use the two supplied frames to establish endpoints. "
              f"The central passage remains clear. Atmospheric motion stays light enough that the shot can be retimed. "
              f"The final camera framing must settle exactly on LAST_FRAME.png. Render an empty environmental plate, "
              f"leaving the graduation cap, portrait, character, text and memory cards for web compositing.")
    write(folder+'/PROMPT_TRANSITION_EN.txt', prompt, preserve=True)
    write(folder+'/NEGATIVE_PROMPT.txt', negative_shared + ', aimless camera drift, orbit, repeated approach, bounce-back, sudden lens zoom, prolonged static camera during the travel interval', preserve=True)
    output = folder+f'/OUTPUT/{ident}_{a["id"]}_TO_{b["id"]}.mp4'
    write(folder+'/HUONG_DAN.txt', f"{ident} — {title}\n\n"
          f"Ảnh đầu: FIRST_FRAME.png (= {a['id']}/REFERENCE.png).\nẢnh cuối: LAST_FRAME.png (= {b['id']}/REFERENCE.png).\n"
          f"Phải chọn hai ảnh vào đúng trường ảnh đầu/ảnh cuối; không gộp ảnh thành collage.\n"
          f"Dán PROMPT_TRANSITION_EN.txt. Chọn 16:9, 1080p nếu có, nguồn 8 giây.\n"
          f"Lưu nguyên bản tại OUTPUT/{Path(output).name}.\n\n"
          f"Clip gen 8 giây KHÔNG phải thời gian chờ trên web. Mục tiêu đoạn di chuyển trong nguồn: giây 2.5–4.5.\n"
          f"Sau khi duyệt video, sẽ đo lại đoạn camera thực sự di chuyển, cắt và retime về khoảng 0.9–1.4 giây trên web.\n"
          f"Không tự tăng tốc cả 8 giây lên 8x. Không tự cắt trước khi bàn giao. Timing của model chỉ là yêu cầu, phải kiểm tra đầu ra.\n"
          f"Nếu công cụ bạn dùng không có điều khiển ảnh cuối: chưa gen hàng loạt các đoạn nối; dùng thử ba clip pilot trước.\n", preserve=True)
    write(folder+'/OUTPUT/DAT_VIDEO_VAO_DAY.txt', f"Đặt bản xuất gốc tại đây: {Path(output).name}", preserve=True)
    transition = dict(id=ident, title=title, source=a['id'], destination=b['id'], folder=folder,
                      first_frame=folder+'/FIRST_FRAME.png', last_frame=folder+'/LAST_FRAME.png', output=output,
                      suggested_source_motion_window=[2.5,4.5], target_web_duration_seconds=1.15)
    transitions.append(transition)
    tasks.append(dict(id=f'{ident}_{a["id"]}_TO_{b["id"]}', kind='transition', source=a['id'], destination=b['id'],
                      prompt=folder+'/PROMPT_TRANSITION_EN.txt', first_frame=transition['first_frame'], last_frame=transition['last_frame'],
                      output=output, preferred_generation_seconds=8, suggested_source_motion_window=[2.5,4.5],
                      target_web_duration_seconds=1.15, pilot=index==0))

plan = dict(schema_version=2, created_local_date='2026-11-14', timezone='Asia/Ho_Chi_Minh',
            status='waiting_for_user_generated_media', active_website_modified=False,
            source_archive='Graduation_Videos.rar', stops=stops, transitions=transitions, tasks=tasks,
            door_flow=dict(source='S05',transition='T05',destination='S07',extra_door_stop=False,intentional_gestures=1,
                           instruction='Already see the door at the final memory. Next scroll opens it and enters the hall without stopping at the threshold.'),
            output_spec=dict(preferred_width=1920, preferred_height=1080, minimum_width=1280, minimum_height=720,
                             aspect_ratio='16:9', generation_seconds=8, audio='not needed; preserve source if generated',
                             web_transition_target_seconds=[.9,1.4], web_duration_is_not_generation_duration=True),
            sources=[dict(title='Google: first and last frames',url='https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-first-and-last-frames'),
                     dict(title='Google: video prompt guide',url='https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide'),
                     dict(title='Google: current Gemini API video availability',url='https://ai.google.dev/gemini-api/docs/video')])
write('04_HANDOFF/asset-plan.json', json.dumps(plan,ensure_ascii=False,indent=2))
write('04_HANDOFF/reviews.json', json.dumps({task['id']:dict(accepted=False,video_sha256=None,notes='',actual_motion_window_seconds=None) for task in tasks},ensure_ascii=False,indent=2),preserve=True)
write('03_PERSONAL_ASSETS/HUONG_DAN.txt', 'Ảnh thật đặt vào các thư mục portrait, memory-1 đến memory-4.\nƯu tiên ảnh gốc, không cắt sẵn và không chèn chữ. Thư mục này KHÔNG dùng để upload vào Veo nền.\nKhi tích hợp, ảnh thật hiển thị bằng HTML/WebGL riêng; không yêu cầu Veo vẽ khuôn mặt của Minh.\nẢnh portrait.png hiện tại trong app là chibi minh họa, không phải ảnh chân dung thật.\n')
for name in ['portrait','memory-1','memory-2','memory-3','memory-4']:
    write('03_PERSONAL_ASSETS/'+name+'/DAT_ANH_THAT_VAO_DAY.txt', f'Đặt ảnh thật cho {name} ở đây. Giữ tên gốc cũng được; bước tích hợp sẽ kiểm tra và tối ưu.',preserve=True)

write('00_DOC_TRUOC.txt', '''BẮT ĐẦU BẰNG START_HERE.html (mở bằng trình duyệt).

Bộ chuẩn bị: 8 video nền camera đứng yên + 7 video di chuyển = 15 clip gốc.
Năm 4 đã gần thấy cửa. Cuộn thêm một nhịp → T05 mở cửa và đi thẳng vào hội trường S07.
Không có điểm dừng riêng trước cửa. S06/T06 đã ngừng dùng; giữ ID các cảnh còn lại để tránh nhầm file.
Làm thử trước đúng 3 clip: S01_AMBIENT, S02_AMBIENT, T01_S01_TO_S02.
Duyệt bộ pilot có nối đúng camera/ảnh và cảm giác tiến nhanh rồi mới tạo phần còn lại.

Mỗi thư mục đã có ảnh nền trích từ video của bạn, prompt tiếng Anh để copy,
hướng dẫn tiếng Việt và OUTPUT để bỏ video về. Không ghép tên/card/nón vào video.
Bạn có thể thay ảnh REFERENCE.png tương ứng trước khi gen; sau đó chạy tools/sync_references.py.

Ảnh nguồn giữ nguyên nội dung video: chữ/logo/chi tiết AI có thể đã nằm sẵn trong ảnh.
Duyệt ảnh trước; prompt video không thay thế việc chuẩn bị ảnh sạch. Bản đồ thật và chữ sự kiện là lớp web riêng.

Nguồn video đề nghị: 16:9, 1080p, 8 giây; 720p vẫn nhận để làm pilot.
Nhịp web dự kiến 0.9–1.4 giây/đoạn bay. Đây là việc cắt/retime sau khi duyệt, KHÔNG yêu cầu Veo gen 1 giây.
Đoạn nền đứng tại chỗ sẽ phát vòng tiến 1x; không đảo chiều video để nối vòng.

Veo: kiểm tra công cụ đang dùng có ảnh đầu/ảnh cuối. Tài liệu Google hiện ghi Veo 3.1 GA hỗ trợ tính năng này;
không dùng ID preview cũ trong Gemini API. Links và ngày kiểm tra nằm trong START_HERE.html.
Nếu giao diện không có ảnh cuối, chỉ làm thử pilot trước và cho biết công cụ/model cụ thể khi bàn giao.

Đặt bản xuất gốc đúng tên trong OUTPUT. Không tự crop/đổi fps/tăng tốc hoặc xóa bản gốc.
Chạy: python VEO3_PRODUCTION_KIT/tools/check_assets.py --scope pilot --allow-missing
Kiểm tra đủ: python VEO3_PRODUCTION_KIT/tools/check_assets.py
Kiểm tra kỹ thuật không thay thế duyệt hình. Chỉ đánh dấu accepted sau khi xem video.

Web hiện tại chưa được thay bằng các file chưa tồn tại. Bản thiết kế lại và kế hoạch tích hợp ở 04_HANDOFF/INTEGRATION_PLAN.html.
Khi tạo xong, báo đã bỏ video vào OUTPUT; bước sau sẽ duyệt, tối ưu, ráp và kiểm thử web hoàn chỉnh.
''')

# Contact sheet is a labelled review layout, never an input image for generation.
contact = Image.new('RGB',(1440,3*320),'#081423')
draw=ImageDraw.Draw(contact)
try: font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',18)
except OSError: font=ImageFont.load_default()
for index,stop in enumerate(stops):
    image=Image.open(root/stop['reference']).convert('RGB');image.thumbnail((456,256))
    x=(index%3)*480+12;y=(index//3)*320+12
    contact.paste(image,(x,y));draw.text((x,y+265),stop['id']+' · '+stop['title'],fill='#eed6a6',font=font)
if len(stops)==8:
    for line,text in enumerate(['S05  →  T05  →  S07', 'Một nhịp cuộn', 'Cửa mở → vào hội trường', 'Không có điểm dừng riêng ở cửa']):
        draw.text((984,680+line*37),text,fill='#eed6a6' if line==0 else '#a8bbd3',font=font)
contact.save(root/'STORYBOARD.jpg',quality=93)

css='''*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#081423;color:#e7edf6;font:15px/1.75 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:50px 24px 90px}a{color:#e5c78b}h1{font:500 clamp(32px,5vw,62px)/1.1 Georgia,serif;margin:14px 0 24px}h2{font-size:25px;margin:40px 0 16px}h3{font-size:19px;margin:0 0 10px}.eyebrow{color:#d7bc86;letter-spacing:.18em;font-size:11px}.lead{max-width:850px;color:#b4c3d8}.panel{background:#102238;border:1px solid #d8bf8d33;border-radius:12px;padding:23px;margin:20px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{overflow:hidden;background:#102238;border:1px solid #d8bf8d33;border-radius:10px}.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}.body{padding:18px}.muted{color:#a4b6cf}small{color:#a4b6cf}pre{white-space:pre-wrap;word-break:break-word;font:12px/1.7 ui-monospace,monospace;padding:16px;background:#07111e;border-radius:8px}button{cursor:pointer;background:#ebd29b;color:#122136;border:0;border-radius:5px;padding:10px 14px;font-weight:600}details{margin-top:15px}summary{cursor:pointer;color:#e5c78b}code{word-break:break-word;color:#ebd29b}img.sheet{width:100%;border-radius:12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pair img{width:100%;aspect-ratio:16/9;object-fit:cover}table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #ffffff1c;text-align:left;vertical-align:top}nav{display:flex;flex-wrap:wrap;gap:15px;margin:20px 0 35px}.badge{display:inline-block;font-size:10px;color:#e8ce95;border:1px solid #e8ce9544;border-radius:20px;padding:3px 9px}input{accent-color:#e8ce95}footer{margin-top:60px;color:#8193ac;font-size:12px}@media(max-width:850px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.grid,.pair{grid-template-columns:1fr}main{padding:30px 16px}.panel{padding:16px}}'''

def document(title,body):
    return '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><style>'+css+'</style><main>'+body+'</main></html>'

body='''<span class="eyebrow">GRADUATION / PRODUCTION HANDOFF · 14.11.2026</span><h1>Chuẩn bị video.<br>Để mỗi nhịp cuộn dẫn một chặng.</h1>
<p class="lead">Đây là bộ tạo tài nguyên cho bản thiết kế tiếp theo. <strong>Camera di chuyển khi cuộn; đến nơi thì camera giữ nguyên và môi trường tiếp tục sống.</strong> Nón 3D, ảnh thật, card, chữ và form thuộc lớp web riêng.</p>
<nav><a href="#pilot">Làm thử 3 clip</a><a href="#stops">8 nền đứng tại chỗ</a><a href="#transitions">7 đoạn di chuyển</a><a href="04_HANDOFF/INTEGRATION_PLAN.html">Audit & kế hoạch web</a><a href="04_HANDOFF/asset-plan.json">Danh mục file</a></nav>
<div class="panel"><h3>Luồng cửa đã sửa</h3><p><strong>Năm 4 đã gần thấy cửa → cuộn thêm một nhịp → cửa mở, nón và camera đi thẳng vào hội trường.</strong> Không có cảnh dừng chờ riêng trước cửa. T05 nối trực tiếp S05 với S07. S06 và T06 đã bỏ khỏi bộ đang dùng; giữ nguyên ID các phần còn lại để không nhầm tài nguyên.</p></div>
<div id="pilot" class="panel"><h3>Bắt đầu nhỏ: S01 + S02 + T01</h3><p>Tạo nền thiệp mời, nền Năm 1 và đoạn bay nối hai nơi. Chỉ khi ba clip này giữ đúng kiến trúc, camera và góc nhìn thì mới tạo 12 clip còn lại. Các prompt phía dưới copy độc lập, không phải sửa tên biến.</p></div>
<div class="panel"><h3>Hai loại video, hai quy tắc</h3><p><strong>Nền:</strong> ảnh đầu và ảnh cuối là cùng REFERENCE.png, camera cố định, hiệu ứng chuyển động tiến liên tục, xuất nguyên bản 8 giây.</p><p><strong>Di chuyển:</strong> chọn FIRST_FRAME.png và LAST_FRAME.png đúng hai ô. Nguồn 8 giây có đoạn di chuyển tập trung khoảng giây 2.5–4.5. Nhịp web 0.9–1.4 giây sẽ được cắt/retime sau khi duyệt; không tăng tốc cả clip 8x.</p><p>Chọn 16:9, 1080p nếu có; 720p đủ cho vòng pilot. Nếu giao diện không có điều khiển ảnh cuối, chưa tạo hàng loạt đoạn nối. Ảnh đánh dấu chữ trong STORYBOARD chỉ để xem; upload các PNG gốc trong thư mục, không upload collage.</p></div>
<img loading="lazy" class="sheet" src="STORYBOARD.jpg" alt="Tám điểm dừng theo thứ tự">
<h2 id="stops">8 điểm dừng · video nền đứng tại chỗ</h2><div class="grid">'''
for stop in stops:
    prompt=(root/(stop['folder']+'/PROMPT_AMBIENT_EN.txt')).read_text(encoding='utf-8')
    body+=f'''<article class="card"><a href="{stop['reference']}"><img loading="lazy" src="{stop['reference']}" alt="{html.escape(stop['title'])}"></a><div class="body"><span class="badge">{stop['id']} {'· PILOT' if stop['id'] in ['S01','S02'] else ''}</span><h3>{html.escape(stop['title'])}</h3><p>{html.escape(stop['content'])}</p><small>{html.escape(stop['layout'])}</small><p><a href="{stop['reference']}">Ảnh upload</a> · <a href="{stop['folder']}/HUONG_DAN.txt">Hướng dẫn</a></p><code>{html.escape(stop['ambient_output'])}</code><details><summary>Prompt Veo · copy</summary><pre>{html.escape(prompt)}</pre><button class="copy">Copy prompt</button><p><a href="{stop['folder']}/NEGATIVE_PROMPT.txt">Negative prompt riêng</a></p></details></div></article>'''
body+='</div><h2 id="transitions">7 đoạn di chuyển · ảnh đầu và cuối đã ghép đúng cặp</h2>'
for transition in transitions:
    prompt=(root/(transition['folder']+'/PROMPT_TRANSITION_EN.txt')).read_text(encoding='utf-8')
    body+=f'''<article class="panel"><span class="badge">{transition['id']} {'· PILOT' if transition['id']=='T01' else ''}</span><h3>{html.escape(transition['title'])}</h3><div class="pair"><div><small>FIRST FRAME · {transition['source']}</small><a href="{transition['first_frame']}"><img loading="lazy" src="{transition['first_frame']}" alt="Ảnh đầu {transition['id']}"></a></div><div><small>LAST FRAME · {transition['destination']}</small><a href="{transition['last_frame']}"><img loading="lazy" src="{transition['last_frame']}" alt="Ảnh cuối {transition['id']}"></a></div></div><p><code>{html.escape(transition['output'])}</code></p><a href="{transition['folder']}/HUONG_DAN.txt">Hướng dẫn đoạn này</a><details><summary>Prompt Veo · copy</summary><pre>{html.escape(prompt)}</pre><button class="copy">Copy prompt</button><p><a href="{transition['folder']}/NEGATIVE_PROMPT.txt">Negative prompt riêng</a></p></details></article>'''
body+='''<h2>Duyệt trước khi gen hàng loạt</h2><div class="panel"><p>Ảnh đầu và cuối phải cùng không gian và đúng thứ tự. Duyệt ảnh nguồn trước khi chi tiền gen: video gốc có chữ, logo hoặc chi tiết AI; prompt không bảo đảm tự làm sạch chúng. Nếu thay một ảnh điểm dừng, chạy <code>python VEO3_PRODUCTION_KIT/tools/sync_references.py</code> để cập nhật mọi đoạn nối liên quan trước khi gen.</p><p>Đánh giá video ở tốc độ 1x: kiến trúc đứng yên ở đoạn nền; camera không trôi; cửa chưa mở khi chưa chuyển chặng; ánh sáng tự nhiên; không thêm nón/chibi/card; đầu-cuối tương thích. Nối vòng kín là tiêu chí cần duyệt, không phải tính năng được bảo đảm chỉ bởi prompt.</p></div>
<h2>Video tạo xong bỏ ở đâu?</h2><p>Đặt đúng tên trong OUTPUT của từng thư mục. Ảnh thật đặt trong <a href="03_PERSONAL_ASSETS/HUONG_DAN.txt">03_PERSONAL_ASSETS</a>. Giữ bản video gốc; không crop hay tăng tốc trước. Công cụ kiểm tra kỹ thuật sẽ báo còn thiếu gì, nhưng không tự thay cho việc duyệt hình.</p><pre>python VEO3_PRODUCTION_KIT/tools/check_assets.py --scope pilot --allow-missing
python VEO3_PRODUCTION_KIT/tools/check_assets.py</pre>
<h2>Nguồn và công cụ</h2><p>Đối chiếu ngày 14/11/2026: Veo 3.1 GA có điều khiển ảnh đầu/cuối. Tài liệu Gemini API thông báo các ID Veo 3.1 Preview cũ đã dừng; kiểm tra model/công cụ thực tế, không dùng lại ví dụ preview cũ. Bộ này dùng prompt thủ công, không gọi API, không tiêu credit.</p><p><a href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-first-and-last-frames">Google: ảnh đầu/cuối</a> · <a href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide">Google: viết prompt</a> · <a href="https://ai.google.dev/gemini-api/docs/video">Google: tình trạng API video</a></p>
<footer>Trạng thái: chuẩn bị tài nguyên; chưa có video Veo mới được nộp/duyệt. Web hiện tại giữ nguyên trong giai đoạn tạo video.</footer>
<script>document.querySelectorAll('.copy').forEach(b=>b.onclick=async()=>{const t=b.parentElement.querySelector('pre').textContent;try{await navigator.clipboard.writeText(t);b.textContent='Đã copy';setTimeout(()=>b.textContent='Copy prompt',1400)}catch{const r=document.createRange();r.selectNodeContents(b.parentElement.querySelector('pre'));const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Đã chọn — Ctrl+C'}});</script>'''
write('START_HERE.html',document('Veo — bộ chuẩn bị video tốt nghiệp',body))
print(json.dumps({'kit':str(root),'stops':len(stops),'transitions':len(transitions),'video_tasks':len(tasks),'status':'references_and_prompts_prepared'},ensure_ascii=False))
