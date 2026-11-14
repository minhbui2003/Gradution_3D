# Graduation 3D — Bàn giao 5 chuỗi ảnh scroll Canvas

## Dữ liệu nguồn đã kiểm chứng
- Nguồn: `Graduation_Videos.rar` do người dùng tải lên, gồm `scene-01.mp4` … `scene-05.mp4`.
- Mỗi video: 1920 × 1080, H.264, 24 FPS, khoảng 7,93 giây (190 frame gốc), có audio AAC.
- Đã xuất **150 WebP/cảnh** (tổng **750 file**) tại 1280 × 720, chất lượng WebP 70.
- Lấy mẫu **đều từ 190 frame gốc, có cả frame đầu tiên và cuối cùng**, thay vì trích ngẫu nhiên.
- Frame đánh số `frame-000.webp` … `frame-149.webp`. Không có các file `frame-150.webp`.
- File manifest toàn bộ: `sequences-manifest.json`; file từng cảnh: `public/sequences/scene-NN/manifest.json`.

## Mô hình ứng dụng
**Một website**, 5 chương có chung normalized scroll progress `p` từ 0 đến 1:

| Scene | Khoảng p | Nền video | HTML/3D cần code |
|---|---:|---|---|
| 01 | 0–0.18 | Tòa nhà IUH navy | Ảnh chân dung THẬT phía phải, thiệp mời + CTA thật phía trái; không có chibi |
| 02 | 0.18–0.42 | Tiến vào IUH → hành lang → cửa hội trường | 4 khung ảnh kỷ niệm thật, xem lớn, mô tả; CSS 3D |
| 03 | 0.42–0.60 | Bên trong hội trường, sân khấu lễ tốt nghiệp | Chibi GLB đứng đúng phối cảnh và chỉ hiện khi camera gần đứng yên; mũ 3D nếu cần |
| 04 | 0.60–0.80 | Sân khấu → sảnh đại học xanh | Timeline **bên trái**, iframe **Google Maps thật bên phải**, chỉ đường/Calendar/ICS |
| 05 | 0.80–1.00 | Sảnh → phòng vinh danh tốt nghiệp | **Sổ lưu bút bên trái**, **RSVP bên phải**, lưu dữ liệu server dùng chung |

## Tích hợp vào GitHub `minhbui2003/Gradution_3D`
1. Giải nén package, copy **thư mục `public/sequences`** vào **`public/sequences`** của repo hiện tại.
2. Đọc ví dụ `src/components/experience/FrameSequenceCanvas.tsx` (là **mã mẫu**, chưa tích hợp trực tiếp và chưa chạy type-check trong repo).
3. Tại `src/app/page.tsx`, giữ nguyên `ScrollDirector`, `progress`, `Navigation`, `InvitationOverlay`, `StoryOverlay`, `EventDetails`, `WishesWall`, `RSVPDrawer`. Chỉ thay/ghép phần **nền `ExperienceCanvas`** thành nền Canvas chuỗi ảnh. **KHÔNG render canvas Three.js nền cũ đè lên Canvas mới vì cảnh cũ có thể phủ kín frame.**
4. Với chibi GLB và mũ có thể dùng một **Three.js Canvas trong suốt** (`gl.alpha: true` và clear alpha 0) ở trên frame Canvas, đồng bộ vị trí và scale theo p. Camera của GLB phải căn phối cảnh video cụ thể, đặc biệt cảnh 03.
5. Các overlay React ở z-index cao hơn; **không bake chữ, ảnh thật, RSVP, Google Maps vào frame**.
6. Khi người dùng kéo Google Maps, nhập form, mở modal ảnh, khóa hoặc cô lập scroll điều khiển camera để không nhảy chương.
7. Xem thử khung hình bằng viewer đơn giản `preview/index.html` trước khi làm React.

## Chạy viewer kiểm thử 5 video (chưa phải website hoàn chỉnh)
Mở terminal tại **thư mục gốc sau khi giải nén**, chạy:

```sh
python -m http.server 8000
```

Sau đó truy cập `http://localhost:8000/preview/`. Đừng mở `preview/index.html` bằng `file://` nếu trình duyệt chặn tải tài nguyên cục bộ.

## Tối ưu
- Tổng bộ 750 WebP 1280 × 720 khoảng 37,8 MiB. **Không tải cả 750 ảnh khi mới mở website**.
- Dùng bộ đệm LRU khoảng 16–32 frame; ưu tiên frame hiện tại và 3–8 frame lân cận; prefetch scene kế tiếp gần ranh giới.
- Tải cảnh 01 trước, trì hoãn các cảnh sau; đưa ảnh lên CDN/cache dài hạn khi triển khai.
- Có ảnh poster fallback và tùy chọn reduce-motion cho thiết bị yếu.
- Mobile 390×844 cần bố cục giao diện riêng và cần xem lại crop của ảnh nền 16:9 (`cover` dễ cắt tòa nhà).
- Video có audio nhưng sequence WebP **không có âm thanh**; nhạc nền phải tích hợp riêng và xin phép bản quyền nếu cần.

## QA đã thực hiện
- 5 MP4 trích xuất thành công từ RAR5; các nguồn đều 1080p / 24 FPS.
- 5 × 150 WebP, kiểm tra các file đầu/giữa/cuối là WebP 1280×720.
- Đối chiếu ảnh cuối scene i và ảnh đầu scene i+1: **bố cục nối tương đối tốt nhưng KHÔNG trùng pixel**. Có thể cần crossfade 4–8 frame hoặc chuyển cảnh bằng ánh sáng nếu thấy giật khi chạy thử.
- `qa/all_scene_contact_sheet.jpg`: 9 mốc mỗi cảnh.
- `qa/scene_boundaries.jpg`: 4 cặp ảnh cuối/đầu để rà lỗi nối.

## Rủi ro cần kiểm tra khi chạy website
- Một số khung hình có biểu tượng/glyph nhỏ góc phải, có thể là chi tiết từ video xuất ra hoặc watermark của công cụ. Kiểm tra điều khoản/nguồn xuất trước khi dùng công khai; không tự ý xử lý che nếu chưa xác định quyền.
- Các chữ/logo IUH trong cảnh 03 đã nằm sẵn trong video; đừng xem chúng là nguồn thông tin chính xác. Thông tin thật hiển thị bằng HTML.
- Cảnh 03 chỉ render sân khấu chưa có chibi; phải căn GLB đúng thời điểm camera gần ổn định.
- Cảnh 05 chưa có form thực. `src/lib/dataAdapter.ts` của repo cũ lưu RSVP và wishes qua `localStorage`; dữ liệu này không đồng bộ giữa các khách. Cần backend có xác thực/giới hạn và moderation nếu website công khai.
- Các video là hình ảnh chuyển động 2D đã render, không có chiều sâu 3D điều khiển camera tùy ý. Vật thể GLB 3D tương tác độc lập mới là 3D thật.

## Tiêu chí nghiệm thu cho AI Agent
- Build/type check đạt, không missing asset 404.
- Cuộn 0→100% và 100→0% ổn định, frame đúng, không đảo thứ tự.
- Test các mốc p: 0, .08, .16, .24, .31, .39, .47, .55, .70, .86, 1.0.
- CTA RSVP, gửi lời chúc, Calendar/ICS, Directions và Google Maps thực sự hoạt động.
- Ảnh thật được lấy từ upload thực tế, **không dùng AI thay gương mặt**.
- Desktop 1440×900 và mobile 390×844 không che chữ/nhân vật.
- Không commit trực tiếp `main`; làm nhánh/PR sau khi kiểm thử.
