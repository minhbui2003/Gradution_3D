# GRADUTION_3D — BÁO CÁO KIỂM TRA & ĐẶC TẢ KHẮC PHỤC CHO AI CODING AGENT

> **Loại tài liệu:** Read-only audit / implementation handoff. **KHÔNG phải mã nguồn, KHÔNG phải báo cáo đã sửa xong.**
>
> **Ngày kiểm tra:** 13/11/2026 (Asia/Ho_Chi_Minh)  
> **Repository:** https://github.com/minhbui2003/Gradution_3D  
> **Nhánh được đọc:** `main` — commit `2233018a0d1e6a27c4c95ec2ab9f6cf079793c2a`  
> **Đầu vào:** đọc các file source qua kết nối GitHub và đối chiếu 11 ảnh chụp `localhost:3000` người dùng gửi.  
> **Giới hạn xác minh:** chưa chạy website, chưa chạy `tsc`, build, test, benchmark hay kiểm tra trực tiếp GLB bằng trình xem 3D. Việc clone vào môi trường kiểm tra không thành công do mạng không phân giải được `github.com`. Mọi kết luận về thực thi chưa quan sát được phải được Agent kiểm chứng lại.

## 0. Yêu cầu và ràng buộc của chủ dự án

- Đích đến: **website thiệp mời lễ tốt nghiệp công khai**, ai mở liên kết cũng xem cùng một lời mời; không yêu cầu nhập tên khách ngay khi vào.
- Phong cách: **Hybrid Cinematic 3D Scrollytelling**, xanh IUH `#2469BC`, midnight navy `#10264A`, trắng/kem `#F4F7FC`, champagne gold `#F0C66D`; chibi tốt nghiệp áo đen viền xanh và vàng.
- Hành trình: **(1) Thiệp mời → (2) Kỷ niệm đại học → (3) Khoảnh khắc trao bằng → (4) Lịch trình & địa điểm → (5) RSVP & lời chúc**. Cảnh 3 là cao trào điện ảnh, còn 4–5 phải dễ sử dụng.
- Giữ lại chức năng hiện có khi hợp lý; **không xóa project / không viết lại từ đầu**.
- Các file `public/references/01-invitation.png` đến `05-wishes-rsvp.png` là **bản concept để đối chiếu bố cục, ánh sáng, mood**, không phải ảnh có thể tự biến thành model 3D.
- Sử dụng **một WebGL Canvas chính**, kết hợp HTML/CSS cho thông tin và form; chuyển cảnh 3D theo scroll, cuộn ngược phải đúng.
- Không tự sáng tác thêm ngày, giờ, địa điểm thật hoặc lời chúc được cho là của người thật. Cần xác nhận dữ liệu sự kiện trước khi phát hành.

## 1. Tình trạng hiện hữu đã kiểm tra

### 1.1. Thành phần đang có — nên giữ lại

| Thành phần | Nơi nằm | Ghi chú |
|---|---|---|
| Next.js/React + R3F/Three + GSAP | `package.json` | Next 14.2.18, React 18.3.1, Three 0.169, R3F 8.17.10, GSAP 3.12.5 |
| Trang scroll dài 700vh | `src/app/page.tsx` | Đã có cấu trúc 5 chương và điều khiển progress |
| Canvas cố định | `src/components/experience/ExperienceCanvas.tsx` | Một Canvas dùng chung — giữ kiến trúc này |
| Camera keyframes | `src/components/experience/CameraRig.tsx` | Có waypoint, cần điều chỉnh quỹ đạo và độ mượt |
| Progress scroll | `src/components/experience/ScrollDirector.tsx` | Có ScrollTrigger, cần kiểm tra độ chính xác và cách scrub |
| Chibi | `public/models/graduate.glb` (~17.8 MB); `graduate_rigged.glb` (~8.6 MB) | Chỉ xác nhận file tồn tại; **chưa xác nhận clip/bone, scale, hướng mặt** |
| Config, menu, overlays, RSVP, wishes | `src/config/*`, `src/components/ui/*` | Có khung chức năng; phần lưu dữ liệu chưa đạt yêu cầu website nhiều khách |
| Ảnh trường và 5 concept | `public/images/`, `public/references/` | Có thể dùng làm tham chiếu hoặc lớp 2.5D |

### 1.2. Những gì CHƯA có trong repository

- Không thấy `public/models/cap.glb`, `diploma.glb`, `envelope.glb`, `campus.glb`, `stage.glb` hay `podium.glb` trong cây file đã đọc. Các vật thể tương ứng **đang được tạo bằng geometry trong React/Three**, không phải GLB chất lượng cao.
- Không thấy một backend API/database thực cho RSVP/lời chúc; `DataAdapter` đang dùng localStorage.
- Không thấy một bộ E2E/visual regression tests trong cây file đã đọc.
- Không có cơ sở để khẳng định chibi hỗ trợ `Walk`, `ReceiveDiploma`, `ThrowCap` như clip thật.

### 1.3. Quy ước đánh giá chứng cứ

- **[CODE — XÁC NHẬN]**: đọc được trực tiếp trong source.
- **[VISUAL — QUAN SÁT]**: thấy trên ảnh `localhost:3000` do chủ dự án gửi.
- **[VERIFY]**: suy luận/nguy cơ, cần chạy ứng dụng hoặc xem GLB thật để xác thực.
- **Mức độ:** `P0` = chặn demo đạt chuẩn hoặc chặn public release; `P1` = quan trọng; `P2` = hoàn thiện sau.

## 2. Danh mục lỗi và yêu cầu xử lý — theo mức ưu tiên

### P0-V01 — Mây cực lớn, xám và che gần hết viewport

- **File:** `src/components/experience/scenes/InvitationScene.tsx` (`LayeredClouds`, `SkyBackdrop`).
- **Bằng chứng:** [VISUAL] tại 0%, 8%, 16% mây trông như hai đĩa xám, che phần lớn phong bì, chibi và background. [CODE] `LayeredClouds` đặt plane với scale đến `[6.2, 3.4, 1]`, có lớp `18 × 5`, các plane nằm gần camera.
- **Phải làm:** kiểm tra alpha thực của `public/images/cloud_soft.png`, UV, premultiplied alpha, `transparent`, `depthWrite/depthTest`, màu tint, sorting; thay bằng bộ cloud card/sprite texture alpha sạch, kích thước phù hợp viewport, đặt phân lớp near/mid/far có khoảng cách và parallax. Giữ khoảng trống cho thông tin mời.
- **Không được:** dùng sphere/plane xám khổng lồ; chỉ chỉnh opacity nhưng vẫn che nội dung; thêm post-processing để che lỗi geometry.
- **Đạt khi:** tại 0/8/16% nhìn rõ chibi, phong bì, tiêu đề; không có đám mây cắt thô; desktop 1440×900 và mobile 390×844 đều cân đối.

### P0-V02 — Phong bì sai hình dạng và sai trạng thái mở

- **File:** `src/components/experience/models/Envelope.tsx`, `InvitationScene.tsx`.
- **Bằng chứng:** [CODE] thân sử dụng `boxGeometry`; nắp dùng `coneGeometry args={[1.4, 1.1, 3]}` xoay theo hinge, tạo khối tam giác dạng nón chứ không phải giấy phẳng. Trong `InvitationScene`, `flapProgress = 0.88 + smoothstep(...) * 0.12`: nắp đã gần mở tối đa ngay từ 0%.
- **Phải làm:** tạo pocket, flap, seal, card là các phần độc lập; flap là **tấm giấy tam giác phẳng có thickness rất mỏng**, pivot chính xác tại cạnh trên; đóng ở 0%, mở có kiểm soát trong 4–9%; không xuyên qua thân; card bật lên vừa phải. Có thể dựng procedural geometry đẹp hoặc dùng model GLB chia pivot.
- **Đạt khi:** tại 0% phong bì nhận diện rõ đang đóng; 8% đang mở và lộ thiệp; 16% kết thúc mà không biến dạng hoặc cắt camera; scroll ngược đưa flap về trạng thái trước đó.

### P0-V03 — Camera, scale và vị trí cảnh đầu không kiểm soát

- **File:** `CameraRig.tsx`, `InvitationScene.tsx`, `Graduate.tsx`, `Envelope.tsx`.
- **Bằng chứng:** [VISUAL] 16% phong bì phóng cực lớn, chibi cắt khung hình. [CODE] model chibi nhận scale ngoài `1.2`/`1.4`, trong `RiggedGlbModel` lại nhân `scale={[2.2,2.2,2.2]}`; `camera` dịch tiến theo mốc, tăng rủi ro đè model.
- **Phải làm:** inspect bounding box thực của mọi GLB và normalize theo chiều cao mục tiêu một lần; có hệ camera framing theo desktop/mobile riêng; xác định safe area cho text; kiểm tra near/far plane, clipping, pivot. Không sửa bằng nhân scale ngẫu nhiên.
- **Đạt khi:** chibi **toàn thân hoặc nửa thân có chủ đích**, luôn hướng về người xem ở hero, không chiếm mất nội dung, không bị cắt đầu/tua mũ khi scroll.

### P0-V04 — Chibi quay ngang/lưng, animation chưa được xác thực

- **File:** `src/components/experience/models/Graduate.tsx`, `MixamoGraduateClips.ts`.
- **Bằng chứng:** [VISUAL] chibi nhìn hẳn sang bên ở hero/cảnh cuối; [CODE] áp góc `finalRotY = -0.85 + rotation[1]` cố định; animation được tạo động bằng cách dò danh sách bone Mixamo, nếu thiếu bone thì trả `[]`.
- **Phải làm:** kiểm tra orientation của GLB trong 3D viewer trước; xác định **local forward axis thực**; đặt transform theo cảnh (hero đối diện camera, campus có thể nhìn vào hành trình, sân khấu hướng khán giả, finale hướng người xem). Log bone list và animation clip thật. Nếu model thiếu rig/clip thì thiết kế pose nhẹ có chủ đích, không nói đã có animation đi bộ/nhận bằng.
- **Đạt khi:** ảnh chibi nhất quán mọi cảnh; không xoay 90° vô cớ, không méo khớp; tình trạng clip được báo cáo dựa trên dữ liệu thật.

### P0-V05 — Cổng trường chỉ là hai cột xanh; ảnh trường bị phóng to như tấm phẳng

- **File:** `src/components/experience/scenes/CampusScene.tsx`, `StoryOverlay.tsx`.
- **Bằng chứng:** [CODE] `CampusGate` dựng bằng boxGeometry cho trụ/ngang; `CampusBackdrop` là `planeGeometry [11,7]` dán `campus_facade.png`. [VISUAL] các ảnh 24–39% như nhìn vào ảnh tòa nhà phóng lớn sau hai cột.
- **Phải làm:** với ảnh tòa nhà gốc chỉ có **một góc nhìn**, **không mô phỏng là kiến trúc 3D thật**. Thay bằng composite 2.5D có lớp foreground trees, cloud, floating polaroid, ánh sáng, path dẫn hướng; camera chỉ parallax/zoom vừa phải. Chỉ dùng camera xoay hoặc đi xuyên cổng khi đã có geometry thật. Bốn ảnh ký ức nên là dữ liệu ảnh thật có chỗ thay, không dùng 4 ảnh concept thay ảnh kỷ niệm thực tế.
- **Đạt khi:** mỗi cột mốc có ảnh, tiêu đề ngắn, thời gian đọc; không có billboard bị lộ như tấm ảnh khổng lồ; không phóng vượt độ phân giải.

### P0-V06 — Hội trường/sân khấu thiếu bối cảnh và cao trào

- **File:** `src/components/experience/scenes/CeremonyScene.tsx`.
- **Bằng chứng:** [CODE] `AuditoriumStage` là nền và vài box, backdrop phẳng, bục dạng box; [VISUAL] 47% gần như nền navy trống, không nhìn ra hội trường hoàn chỉnh.
- **Phải làm:** dựng sân khấu có tầng sàn, background, rèm thật hoặc rèm mô phỏng đẹp, bậc lên xuống, podium, hệ chiếu sáng/spotlights, dãy ghế ở foreground, chibi ở vị trí trung tâm có ánh sáng chiếu đúng. Có thể ghép nhiều prop vừa phải thay vì một model khổng lồ. Quan trọng nhất là bố cục nhìn **rõ đây là lễ trao bằng**.
- **Đạt khi:** ở 47% và 55% ảnh tĩnh đủ đẹp để nhận ra sự kiện, có ánh sáng chủ thể và không bị quá tối.

### P0-V07 — Tung mũ và nhận bằng có nguy cơ bị nhân đôi

- **File:** `Graduate.tsx`, `CeremonyScene.tsx`, `Cap.tsx`, `Diploma.tsx`.
- **Bằng chứng:** [VISUAL] chibi đang đội mũ/cầm bằng trong ảnh hiện tại; [CODE] tại `p >= 0.53` lại render thêm `<Cap />` và từ `p >= 0.48` render `<Diploma />` rời bên ngoài.
- **Phải làm:** inspect mesh tree GLB để xác định mũ, bằng gắn liền cùng model hay tách được. Nếu không tách được, **không diễn giả động tác tung chiếc mũ từ trên đầu thật** khi nó vẫn còn trên đầu. Có thể dùng một mũ biểu tượng chuyển cảnh riêng, hoặc yêu cầu chibi phiên bản không đội mũ + `cap.glb` riêng nếu muốn tung mũ chân thực. Diploma phải có liên hệ đúng với bàn tay/pose.
- **Đạt khi:** không có hai mũ/two diplomas trong cùng khung hình trừ khi có lý do nghệ thuật rõ; thao tác nhận bằng/tung mũ có logic vật lý và thị giác.

### P0-D01 — RSVP và lời chúc CHƯA dùng chung giữa các khách

- **File:** `src/lib/dataAdapter.ts`, `RSVPDrawer.tsx`, `WishesWall.tsx`.
- **Bằng chứng:** [CODE] `getWishes/addWish/likeWish/saveRSVP` dùng `localStorage`, không thấy API/database. RSVP lưu một bản ghi localStorage cho một trình duyệt. `saveRSVP` vẫn trả về thành công ngay cả khi lưu thất bại; form hiển thị thông báo đã ghi nhận.
- **Phải làm trước khi phát hành thật:** tạo backend (Next API route/server action + Supabase/Postgres hoặc phương án tương đương), validation server-side, giới hạn gửi/spam, lưu `created_at`, trạng thái duyệt lời chúc, xác nhận thành công **chỉ sau phản hồi server**. Phân quyền admin để xem RSVP, không public danh sách khách riêng tư. Cần quy định retention và thông báo riêng tư cơ bản.
- **Thời điểm:** có thể triển khai sau khi đạt bản demo thị giác, nhưng **phải làm trước khi mở RSVP/lời chúc cho khách thật**.
- **Đạt khi:** gửi từ thiết bị A → admin nhận được; lời chúc đã duyệt xuất hiện ở thiết bị B; offline/server lỗi hiển thị thất bại, không báo thành công giả; không thể spam vô hạn.

### P0-D02 — Nội dung sự kiện, tên người gửi lời chúc và Maps có dữ liệu chưa xác nhận

- **File:** `src/config/event.ts`, `src/components/ui/InvitationOverlay.tsx`, `EventDetails.tsx`, `src/app/layout.tsx`, `dataAdapter.ts`.
- **Bằng chứng:** [CODE] cấu hình đang ghi `25/11/2026`, `07:00–11:30`, `Hội trường E4` và địa chỉ; `googleMapsDirectUrl` là một shortlink `maps.app.goo.gl/3q4a7c8d9e` **cần kiểm tra thực tế**; `INITIAL_WISHES` có lời chúc gán cho "Ba Mẹ", "Thầy Hùng", "Nhóm Bạn Thân" với lượt tim cụ thể. Những nội dung này **chưa được người dùng xác nhận** trong cuộc trao đổi đang xét.
- **Phải làm:** đưa toàn bộ ngày/giờ/tên hội trường/địa chỉ/route/metadata/calendar vào **một config trung tâm đã xác nhận**. Nếu chưa có dữ liệu thật, dùng `Đang cập nhật` và tắt đường dẫn calendar/directions phụ thuộc dữ liệu đó. Demo wishes phải ghi nhãn "Minh họa" hoặc ẩn trong bản public; không mạo nhận người thật đã viết.
- **Đạt khi:** không có ngày/địa điểm hardcode ngoài config; đường dẫn Maps mở đúng địa điểm thực; sample wishes không bị coi là thật.

### P1-A01 — Chuyển động không tái hiện chính xác khi cuộn ngược

- **File:** `Cap.tsx`, `Graduate.tsx`, `CeremonyScene.tsx`, `InvitationScene.tsx`, `ScrollDirector.tsx`.
- **Bằng chứng:** [CODE] `Cap.tsx` tăng `groupRef.current.rotation.y += 0.04` mỗi frame (phụ thuộc FPS và lịch sử thời gian); `Graduate.tsx` gọi `AnimationMixer.update(delta)`; confetti cập nhật theo frame. Đây là animation theo **thời gian thực**, không phải pose xác định từ progress.
- **Phải làm:** với mọi chuyển động cốt truyện (nắp mở, mũ bay, bước đi, nhận bằng, camera), lấy biến đổi từ **progress tuyệt đối**; dùng keyframes/quaternion/spline và seek animation clip tương ứng. Chỉ để idle, sparkle, mây trôi là các hiệu ứng tự chạy. Sử dụng dữ liệu hạt có seed và tính vị trí theo phase nếu hạt thuộc cốt truyện.
- **Đạt khi:** cùng p=0.55 cho cùng hình ảnh bất kể tới từ 0.40 hay 0.70; cuộn nhanh/chậm/ngược không tạo teleport hoặc mũ bay vòng vô hạn.

### P1-A02 — Scene mount/unmount đột ngột tại ranh giới

- **File:** `InvitationScene.tsx` (`p < 0.22`), `CampusScene.tsx` (`0.16–0.44`), `CeremonyScene.tsx` (`0.40–0.62`), `EventScene.tsx` (`0.58–0.82`), `WishesScene.tsx` (`p >= 0.78`).
- **Phải làm:** quản lý overlap và opacity/fog/transition chung; không khiến scene biến mất trước khi camera kết thúc; preload scene sắp đến; có thể unmount scene xa sau khi ra khỏi transition để tiết kiệm GPU, nhưng không giật và không mất asset khi scroll đảo chiều.
- **Đạt khi:** ranh giới 0.18/0.42/0.60/0.80 không nháy, trắng, đen, nhảy vật thể hay mất texture.

### P1-A03 — Camera có thể dừng/giật tại từng waypoint, còn thiếu khung hình responsive

- **File:** `CameraRig.tsx`, `ScrollDirector.tsx`.
- **Bằng chứng:** [CODE] `smoothstep` áp cho từng đoạn waypoint riêng, khiến vận tốc tiến về 0 ở mỗi mốc; `camera.position.lerp` phụ thuộc khung hình. `scrollToProgress` lấy tổng chiều cao document trong khi ScrollTrigger sử dụng bounds của scroll container.
- **Phải làm:** đường camera liên tục cả vị trí lẫn hướng nhìn, kiểm soát speed bằng arc-length hoặc spline, ưu tiên giữ ổn định ở đoạn đọc chữ; tính scroll seek từ `trigger.start/end` thực hoặc một nguồn progress chung; nội suy thích nghi resize và mobile; tránh di chuyển xuyên mesh.
- **Đạt khi:** không có cú dừng vô cớ ở waypoint trung gian, điều hướng menu tới đúng chapter, viewport đổi kích thước không lệch progress.

### P1-A04 — `SkyBackdrop` tạo texture trong render và có nhánh SSR không an toàn

- **File:** `InvitationScene.tsx` (`SkyBackdrop`).
- **Bằng chứng:** [CODE] `new THREE.CanvasTexture(...)` được tạo trực tiếp trong JSX mỗi render; câu `if (typeof document === 'undefined') return document` vẫn tham chiếu tới `document` ở nhánh biến chưa tồn tại (dù hiện Canvas nạp client-only).
- **Phải làm:** khởi tạo texture qua `useMemo`/asset tĩnh, dispose khi không dùng; thay đường code SSR bằng nhánh an toàn; bảo đảm gradient/phối cảnh không tạo seam.
- **Đạt khi:** cuộn liên tục không sinh thêm WebGL texture vô hạn, không console warning/SSR error.

### P1-A05 — Re-render UI với progress quá thường xuyên, thiếu cơ chế graceful failure

- **File:** `src/app/page.tsx`, `ExperienceCanvas.tsx`, `Graduate.tsx`.
- **Bằng chứng:** [CODE] `onProgress={setProgress}` cập nhật state trang ở mỗi ScrollTrigger update; `<Suspense fallback={null}>` ẩn nội dung khi asset tải chậm; canvas không thấy error boundary/fallback thân thiện.
- **Phải làm:** tối ưu lưu progress cho animation liên tục (ref/store/event), chỉ cập nhật React UI ở tần suất hợp lý; thêm loading và graceful fallback khi WebGL/GLB thất bại; lazy-load model/cảnh nhưng không để trống toàn viewport.
- **Đạt khi:** lướt nhanh không giật theo React re-render, không màn hình đen trong lúc tải, có chế độ nội dung tĩnh khi WebGL không hỗ trợ.

### P1-UI01 — Active tab menu không đúng, toggle nhạc chỉ đổi icon

- **File:** `src/components/ui/Navigation.tsx`.
- **Bằng chứng:** [CODE] `isActive = activeScene.name === item.label`, trong khi `SCENES` có tên `Kỷ niệm IUH`, `Lễ Trao Bằng`, `Thông tin Lễ`, `Lưu bút & RSVP` khác label menu. `isMuted` chỉ đổi icon, không liên kết với audio thật.
- **Phải làm:** so active bằng scene `id`/`range` thay vì chuỗi display; nút audio chỉ hiển thị nếu có audio thật, không autoplay, mặc định tắt, giữ trạng thái có phản hồi; nếu chưa có nhạc thì ẩn hoặc vô hiệu hóa có chú thích.
- **Đạt khi:** tab active đúng tại mọi chapter; âm thanh đúng trạng thái biểu thị.

### P1-UI02 — Debug và overlay có thể gây nhiễu/chặn thao tác

- **File:** `DebugPanel.tsx`, `InvitationOverlay.tsx`, `WishesWall.tsx`, `EventDetails.tsx`, `RSVPDrawer.tsx`.
- **Bằng chứng:** [CODE] `DebugPanel` luôn render và in "graduate.glb loaded" dưới dạng kết luận tĩnh; `InvitationOverlay` opacity về 0 nhưng inner vẫn có `pointer-events-auto` trước khi unmount; các modal/drawer chưa có focus trap/Escape/body scroll lock.
- **Phải làm:** Debug chỉ hiện trong development; trạng thái asset dựa trên loader thực; overlay mờ/tàng hình phải vô hiệu click; modal/drawer cần Escape, focus trap, restore focus, cuộn trang khóa khi mở, aria-label cho nút đóng; kiểm tra layering z-index.
- **Đạt khi:** không có debug trong release; mọi overlay/CTA dễ bấm trên mobile; mở form không làm camera scroll nền và không bị mất bàn phím/focus.

### P1-UI03 — Thông tin Hero chưa tập trung thông điệp chính

- **File:** `InvitationOverlay.tsx`, `InvitationScene.tsx`.
- **Bằng chứng:** [VISUAL] overlay bị đặt trước phong bì lớn; card đọc được nhưng hình ảnh phân tán, sai hierarchy. [CODE] `InvitationOverlay` có text ngày/venue hardcode thay vì đọc hoàn toàn từ `EVENT_DATA`.
- **Phải làm:** ngay 5 giây đầu phải thấy **Lễ Tốt Nghiệp — Bùi Tất Nhựt Minh — Khoa CNTT — lời mời chung — ngày/giờ/địa điểm nếu đã xác nhận**; CTA `Khám phá` và `Xác nhận tham dự`. Hero không cần hiển thị 3–4 ý quan trọng cùng một font/cỡ chữ; bố cục web/3D phải bổ trợ nhau.
- **Đạt khi:** người mới truy cập biết đây là thiệp mời chung, không bị buộc nhập tên, đọc được thông tin trong 5 giây.

### P1-UI04 — Kỷ niệm đang dùng ảnh concept thay ảnh đời thực

- **File:** `src/config/event.ts` (`stories`), `public/images/memory_1.png`–`memory_4.png`, `StoryOverlay.tsx`.
- **Bằng chứng:** [CODE/tree] ảnh `memory_*` trùng bộ ảnh concept, không phải tập ảnh kỷ niệm sinh viên được xác nhận.
- **Phải làm:** hỗ trợ thay 4–5 ảnh thật qua config; nếu chưa có ảnh, dùng ảnh minh họa có nhãn/trạng thái, không nói đây là ảnh thật đã chụp. Cần caption ngắn 1–2 câu, UX dừng đọc đủ lâu, ảnh giữ đúng aspect ratio/crop.
- **Đạt khi:** 4 mốc hiển thị liền mạch, có ảnh đáng tin cậy và không mờ.

### P1-D03 — Calendar hardcode, ICS chưa robust

- **File:** `src/components/ui/EventDetails.tsx`, `src/config/event.ts`.
- **Bằng chứng:** [CODE] `DTSTART:20261125T000000Z`, `DTEND:20261125T043000Z`, Google Calendar `dates=...` hardcode; không lấy từ `EVENT_DATA.ceremony.isoDate/isoEndDate`; download `.ics` không revoke Blob URL và chưa có UID/DTSTAMP.
- **Phải làm:** chuyển từ ISO (+07:00) sang UTC một cách nhất quán; derive cả `.ics` và Google Calendar từ config; escape dấu phẩy/chấm phẩy/xuống dòng theo chuẩn ICS, thêm UID/DTSTAMP; revoke Blob URL sau khi dùng; test import trên Google/Apple/Outlook.
- **Đạt khi:** sửa ngày/giờ tại một nơi thì hero/timeline/Google Calendar/ICS đều đổi đúng.

### P1-D04 — RSVP số người không rõ nghĩa, xử lý lỗi chưa đầy đủ

- **File:** `RSVPDrawer.tsx`, `dataAdapter.ts`.
- **Bằng chứng:** [CODE] label "Số lượng người đi cùng" nhưng chọn `1 = Đi một mình`, `4 = Đi nhóm (4+ người)` rồi lưu `guestCount=4`; không lưu chính xác nếu có >4. `setTimeout` đóng drawer sau 2.5s không cleanup.
- **Phải làm:** ghi rõ "Tổng số người (bao gồm bạn)" hoặc "Người đi cùng (không tính bạn)" và thống nhất schema; input số nguyên có max thực tế; server validation; trạng thái pending/success/error và timer cleanup; giữ dữ liệu khi submit lỗi.
- **Đạt khi:** số khách có nghĩa rõ, không lẫn 4 và 4+; lỗi server không đóng form hay báo lưu thành công.

### P1-D05 — Lời chúc thiếu chống spam, kiểm duyệt và ảnh đính kèm

- **File:** `WishesWall.tsx`, `dataAdapter.ts`.
- **Bằng chứng:** [CODE] like và gửi chỉ local; dữ liệu demo fake. Form hiện chỉ có text, quan hệ, tên; ảnh upload chưa có.
- **Phải làm:** giai đoạn 1 text + optional image (theo yêu cầu trước đây), upload an toàn qua storage với kiểm tra MIME, dung lượng, giới hạn nội dung, moderation, pagination và rate limit; không cần video/voice trong MVP. Nếu thời gian hạn chế, ghi tính năng ảnh là backlog có nhãn, không vờ đã hỗ trợ.
- **Đạt khi:** người dùng khác nhìn được lời chúc được duyệt; gửi hàng loạt bị hạn chế; ảnh sai định dạng bị từ chối.

### P1-P01 — Quá nặng với mobile và chưa có fallback giảm chuyển động

- **File:** `ExperienceCanvas.tsx`, `Graduate.tsx`, `src/app/page.tsx`.
- **Bằng chứng:** [CODE/tree] hai GLB 17.8 MB + 8.6 MB tồn tại, bản rigged được dùng; Canvas `dpr={[1,1.75]}` nhưng chưa có quality tier; khoảng 700vh và nhiều particle.
- **Phải làm:** chỉ load đúng bản cần dùng, giảm kích thước glb (Draco/Meshopt, KTX2/texture WebP nếu phù hợp), đo số draw calls và memory, ưu tiên preload hero; dynamic quality desktop/mobile; hỗ trợ `prefers-reduced-motion`, fallback tĩnh có CTA/Calendar/Maps khi WebGL không chạy.
- **Đạt khi:** mobile cuộn/tap không đứng hình, CTA/Form hoạt động dù WebGL lỗi, không tải cả hai bản chibi không cần thiết.

### P2-C01 — Loại bỏ hardcode/style nhỏ và nâng chuẩn code

- `tsconfig.json`: hiện `strict: false`; nên chuyển `strict: true` có kế hoạch và sửa lỗi type, không bật rồi bỏ qua build hỏng.
- `Navigation.tsx`: string label và dữ liệu active trùng lặp, nên map theo `SCENES` id.
- `InvitationScene.tsx`: `GoldenSparkles` và vài particle đang dựa `Math.random()`; nên seed nếu cần tái lập visual regression.
- `EventScene.tsx`/`WishesScene.tsx`: particle dùng sphere vertices đang tĩnh; kiểm tra hiệu quả, không thêm hạt vô ích.
- `DebugPanel.tsx`: không để thông tin debug làm nhiễu người xem public.
- Metadata/OG image: dùng ảnh preview thực đẹp, không mặc định dùng ảnh concept kỷ niệm sai nội dung; kiểm tra title/OG link khi share Messenger/Zalo.

## 3. Đặc tả thiết kế và chuyển cảnh cuối cùng

### 3.1. Thời gian cuộn (global normalized progress 0–1)

| Khoảng | Phân cảnh | Camera | Object bridge | Text/CTA |
|---|---|---|---|---|
| 0.00–0.18 | Thiệp mời | Qua mây → giữ bố cục hero | Phong bì mở, mũ xuất hiện/bay dẫn hướng | Lời mời chung, tên, ngày nếu có |
| 0.18–0.42 | Hành trình | Hạ trước trường → parallax qua 4 ảnh | Mũ + vệt sáng vàng | 4 ảnh, 4 caption ngắn |
| 0.42–0.60 | Trao bằng | Chuyển từ ảnh cuối vào sân khấu → giữ cận chibi | Ánh sáng khớp cảnh, mũ rời cảnh | Tiêu đề khoảnh khắc, nội dung tối giản |
| 0.60–0.80 | Lịch trình & địa điểm | Phần lớn ổn định | Mũ thu nhỏ/thiệp chuyển cảnh | Timeline, Maps, chỉ đường, thêm lịch |
| 0.80–1.00 | RSVP & lời chúc | Lùi nhẹ, dừng trên bầu trời/mây ấm | Thẻ lời chúc + chibi vẫy tay | Form, lời chúc, cảm ơn |

**Nguyên tắc:** Không ép toàn bộ cảnh thành GLB khổng lồ. Sử dụng 3D thật cho chibi, mũ, phong bì, một vài prop; dùng composited 2.5D cho ảnh trường, mây và ký ức nếu chưa có kiến trúc 3D đúng. Nội dung tương tác luôn là DOM/HTML.

### 3.2. Tiêu chuẩn theo từng cảnh

**SCENE 01 — Invitation**  
Asset: `graduate_rigged.glb` đã có, phong bì nên dựng lại hinge chuẩn, cap có thể procedural đẹp trước khi tạo GLB; `cloud_soft.png` cần kiểm tra alpha. Bố cục desktop: phong bì ở trái, chibi ở phải, khu chữ trong vùng an toàn không chồng model. Mobile: cấu trúc dọc có chủ đích. Ở p=0 thấy lời mời; p=.08 nắp đang mở; p=.16 cap dẫn sang trường. Không có mây xám cắt cảnh.

**SCENE 02 — Campus / Memories**  
Asset: ảnh trường gốc `campus-original.png`, 4 ảnh kỷ niệm thực nếu có, lớp foreground và khung ảnh, có thể thêm model cổng cách điệu không ghi sai là cổng thật. Camera di chuyển vừa phải vì building hiện chỉ là ảnh. Mỗi ảnh xuất hiện, giữ đủ thời gian đọc, rời đi bằng chuyển động thống nhất. p=.39 ảnh cuối phóng lên và blend nhẹ sang sân khấu.

**SCENE 03 — Graduation Stage**  
Asset: stage, podium, backdrop, hàng ghế, light rig; chibi có model và clip **chỉ sử dụng clip đã kiểm tra**. p=.47 phải nhìn rõ hội trường; p=.55 là đỉnh điểm nhân vật. Nếu chưa có chibi bỏ mũ, hãy dùng mũ biểu tượng bay trên trời thay vì làm giả động tác tháo mũ. Không để sân khấu là khoảng nền navy trống.

**SCENE 04 — Event Information**  
Asset: phần lớn là DOM glass/ivory card và Google Maps thực. p=.70 timeline rõ và click được. Có CTA mở Maps, Calendar và địa điểm xác thực. Trang không bắt khách scroll thêm để làm việc đơn giản. Background có chiều sâu nhưng nhẹ; không có object di chuyển qua chữ.

**SCENE 05 — RSVP/Wishes/Thanks**  
Asset: chibi dùng lại, thư/thiệp DOM và mây/particle nhẹ. p=.86 xem được cards, bấm gửi được; p=1.0 chibi vừa phải và nhìn viewer, lời cảm ơn nổi bật. Không có chibi khổng lồ ẩn phía sau card, không có khoảng trống tối chiếm hầu hết viewport.

## 4. Hướng dẫn kiến trúc cho AI Agent

1. **Preserve** `src/app/page.tsx` và các component đã có, chỉ thay đổi có kiểm soát. Không refactor toàn bộ ứng dụng trong một PR.
2. Tạo một nguồn `experienceProgress` chuẩn, clip/transform 3D được **seek bởi progress tuyệt đối**, không dựa vào tích lũy `delta` cho storytelling.
3. Giữ **một `<Canvas>`**, các nhóm 3D theo khoảng scene; mỗi scene có entry/exit transition overlap có hệ thống (opacity/motion/fog/light), tránh unmount đột ngột đúng ranh giới.
4. Camera position + look target phải vận hành liên tục, không teleport hoặc xuyên mesh. Dùng spline/chuyển động tuyến tính có easing toàn cục; giữ camera khi text cần đọc.
5. Tạo asset manifest **đúng file tồn tại**; bỏ trạng thái giả thành công trong debug. Preload model/texture cần thiết và có placeholder **chủ đích**, không gọi hộp trắng là cảnh hoàn chỉnh.
6. Bảo toàn z-index: Canvas nền, DOM overlays ở trên, navbar và modal ở trên cùng. Khi một overlay biến mất, cũng phải tắt tương tác của overlay đó.
7. Tách `EVENT_DATA` thành nguồn dữ liệu sự kiện đáng tin cậy, không hardcode ngày/giờ ở JSX hoặc Calendar.
8. Khi đưa lên public, gửi RSVP/wishes qua server, validate dữ liệu, duyệt lời chúc và xử lý lỗi thật.
9. Hỗ trợ mobile layout riêng, quality tier, accessibility/focus/reduced-motion, WebGL fallback.
10. Trước khi kết luận xong **phải chạy, chụp và so sánh** ảnh thật với `public/references/0*.png`.

## 5. Kế hoạch triển khai theo đợt — không làm ồ ạt

### PHASE 0 — Baseline, không đổi giao diện

- [ ] Checkout `main` hoặc nhánh làm việc mới của Agent, ghi lại commit SHA và đảm bảo working tree sạch.
- [ ] `npm ci`; chạy `npx tsc --noEmit`, `npm run build`, kiểm tra console, 404 asset, WebGL warnings. Báo cáo log thật, không che lỗi.
- [ ] Chụp baseline 11 mốc scroll desktop và 5 mốc mobile; nếu có công cụ tự động, dùng Playwright để điều hướng chính xác progress.
- [ ] Liệt kê bone names, mesh tree, clips, texture count, bounding box của `graduate_rigged.glb`; kiểm tra mũ/cuộn bằng có gắn trên nhân vật không.
- [ ] Lập bảng `existing / procedural / missing` cho mọi asset.

### PHASE 1 — Hoàn thiện HERO trước tiên

- [ ] Sửa P0-V01, V02, V03, V04 và P1-A04.
- [ ] Giữ camera cân đối tại 0%, 8%, 16%; tối ưu hero mobile.
- [ ] Chụp ảnh và đối chiếu concept `01-invitation.png`.
- [ ] Chỉ chuyển Phase 2 sau khi cảnh đầu đạt nghiệm thu bằng ảnh.

### PHASE 2 — Hành trình trường học

- [ ] Sửa P0-V05, P1-UI04; làm 4 mốc ảnh và parallax có giới hạn.
- [ ] Xử lý chuyển ảnh cuối → mở cảnh trao bằng.
- [ ] Chụp/kiểm tra 24%, 31%, 39%.

### PHASE 3 — Hội trường và animation nhân vật

- [ ] Sửa P0-V06, V07, P1-A01.
- [ ] Hoàn thiện staging/lighting và clip đã xác thực; ưu tiên hình ảnh đẹp trước animation phức tạp.
- [ ] Chụp/kiểm tra 47%, 55% và chuyển sang 60%.

### PHASE 4 — Thông tin sự kiện + RSVP/lời chúc

- [ ] Sửa P0-D01, D02, P1-D03, D04, D05, UI02.
- [ ] Xác thực địa chỉ trước khi bật Maps, Calendar; tích hợp backend nếu sắp public.
- [ ] Chụp/kiểm tra 70%, 86%, 100%; test gửi dữ liệu từ 2 trình duyệt khác nhau.

### PHASE 5 — Scroll polish + performance + accessibility

- [ ] Sửa P1-A02, A03, A05, UI01, P01 và các P2 cần thiết.
- [ ] Kiểm tra cuộn xuôi/ngược/lên xuống nhanh, chuyển tab, resize, mobile và reduced-motion.
- [ ] Chạy build/TS check và báo cáo kết quả; không merge PR nếu còn P0.

## 6. Test matrix bắt buộc và bằng chứng bàn giao

**Desktop:** 1440×900 (hoặc 1920×1080 bổ sung). **Mobile:** 390×844 và 360×800.  
**Các mốc ảnh:** `0%, 8%, 16%, 24%, 31%, 39%, 47%, 55%, 70%, 86%, 100%`.  
**Hành vi:** cuộn tiến, cuộn ngược, kéo nhanh qua nhiều cảnh, nhấn menu từng chapter, refresh ở giữa trang, thay đổi kích thước màn hình, mở/đóng form, bật reduced-motion, mất WebGL/thất bại tải model.

Mỗi ảnh/chặng phải được kiểm:

- [ ] Bố cục có chủ ý, có điểm nhấn, không có quá nhiều nền trống.
- [ ] Chibi đúng hướng, tỉ lệ ổn định, không bị cắt khỏi màn hình vô cớ.
- [ ] Không có mây, hình hộp hay hình phẳng che văn bản.
- [ ] Không thấy camera xuyên vật thể, z-fighting hoặc texture xám/đen bất thường.
- [ ] Chuyển cảnh không nháy; cùng progress cho hình cốt truyện giống nhau dù cuộn ngược.
- [ ] Hero nói rõ lời mời chung; thông tin có nguồn và không tự dựng dữ liệu.
- [ ] Nút RSVP/Maps/Calendar/Wishes hoạt động hoặc được đánh dấu chưa sẵn sàng, không tạo cảm giác giả đã lưu.
- [ ] Forms bàn phím/touch/ESC/Tab sử dụng được; không scroll nền khi đang nhập.
- [ ] Không 404 assets, không console errors, không memory leak/GLB duplicate vô tình.
- [ ] Tất cả test/build mà Agent đã chạy phải được tường trình đúng kết quả (bao gồm thất bại).

**Hiệu năng mục tiêu (không được tuyên bố đạt nếu chưa đo):** trải nghiệm desktop mượt ~60 FPS khi đủ phần cứng; mobile cố gắng ổn định 30–60 FPS; đo FPS, LCP, thời gian tải hero, bộ nhớ GPU ở thiết bị thực/tương đương. Không dùng chỉ số giả định để cam kết.

## 7. Yêu cầu báo cáo của Agent sau khi sửa

Agent phải cung cấp một bảng cho từng task ID: `ID | File thay đổi | Nguyên nhân gốc | Giải pháp | Ảnh trước/sau | Test đã chạy | Trạng thái | Blocker`. Ngoài ra:

1. Danh sách commit/PR, đường dẫn và nhánh làm việc; **không push trực tiếp lên main nếu chưa được chủ dự án cho phép**.
2. Danh sách assets đang dùng, assets thiếu và nguồn/license của assets bổ sung.
3. Kết quả kiểm tra chibi GLB (góc nhìn, bone, clip, mũ và bằng có tách rời hay không).
4. Screenshot thật tại các mốc yêu cầu trên desktop/mobile; ảnh **không phải ảnh concept AI**.
5. Danh sách chức năng thực đã nối server; không gọi localStorage là backend dùng chung.
6. Danh sách thông tin sự kiện còn chờ chủ dự án xác nhận.
7. Các lỗi còn lại, mức độ ảnh hưởng và ưu tiên khắc phục.

## 8. Lệnh yêu cầu AI Agent thực hiện theo báo cáo này

> Hãy đọc toàn bộ file `GRADUTION_3D_AUDIT_FOR_AI_AGENT.md` trước khi sửa. Kiểm tra lại source trên nhánh hiện tại vì báo cáo ghi nhận commit `2233018...` ngày 13/11/2026. Trước tiên chạy baseline và đối chiếu từng vấn đề đã đánh dấu `[CODE]`, `[VISUAL]`, `[VERIFY]`; không mặc định mọi nhận định chưa kiểm chứng đều đúng. Thực hiện theo Phase 0 → Phase 5, ưu tiên đạt chất lượng Scene 01 bằng ảnh chụp thật trước khi mở rộng các cảnh khác. Giữ chức năng đang tốt, không sửa mục ngoài phạm vi, không sáng tác nội dung sự kiện. Mỗi Phase cần ảnh trước/sau, danh sách file, kết quả build/test, và ghi rõ asset nào thiếu. Chỉ gọi tính năng hoàn tất khi đã kiểm thử, đặc biệt backend RSVP/lời chúc phải lưu dùng chung giữa thiết bị. Không tự merge vào `main`.

---

### Ghi chú về giới hạn báo cáo

Đây là audit dựa trên **source code đọc qua GitHub và hình chụp người dùng**, không phải chứng nhận ứng dụng hoạt động ổn định. Các tình huống lỗi shader/driver, GLB, runtime, backend và FPS bắt buộc Agent xác thực khi chạy trên máy phát triển. Báo cáo này **không chỉnh sửa bất kỳ file nào trong GitHub**.
