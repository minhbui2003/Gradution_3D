# 06_REGEN_SCENES — Hướng dẫn sản xuất

Bộ này đã có **8 prompt ảnh mới + 8 prompt video nền + 7 prompt chuyển cảnh** trong các thư mục riêng. Script chỉ chuẩn bị, kiểm tra và đồng bộ input; **không tự gọi Veo/Flow**, không tạo video AI và không thay website đang chạy.

## Chuẩn bị một lần

1. Mở `START_HERE.html`, đọc `SCENE_BIBLE.md`, xem ảnh bố cục và prompt.
2. Cài Python 3.9+; cài FFmpeg với `ffprobe` có trong PATH nếu muốn xác thực MP4.
3. Tất cả file/đường dẫn chuẩn nằm trong `MANIFEST.json`, không đổi ID S01–S09 hoặc T01–T08.

## Pilot ba clip — làm trước

1. Dùng `01_SCENES/S01_INVITATION/PROMPT_IMAGE_EN.txt` tạo ảnh S01 mới. Duyệt bố cục rồi lưu vào `01_SCENES/S01_INVITATION/INPUT/REFERENCE.png`.
2. Dùng prompt S02 tạo ảnh bên dưới mái kính, bắt buộc giữ **cùng kiến trúc của S01**. Lưu vào `01_SCENES/S02_MEMORY_YEAR_1/INPUT/REFERENCE.png`.
3. Chạy `DONG_BO_INPUT.bat` hoặc `python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/sync_inputs.py`. Script tạo cặp ảnh FIRST_FRAME/LAST_FRAME cho T01.
4. Tại công cụ tạo video có hỗ trợ first/last frame: tạo `S01_AMBIENT.mp4` và `S02_AMBIENT.mp4` (cùng ảnh REFERENCE.png làm frame đầu và cuối, 8 giây, camera tĩnh).
5. Tạo `T01_S01_TO_S02.mp4` từ ảnh đầu/cuối đã đồng bộ, camera dolly tiến; sử dụng `PROMPT_TRANSITION_EN.txt`.
6. Lưu video gốc đúng `OUTPUT` được ghi trong `MANIFEST.json`. Xem nối S01 → T01 → S02, xác nhận cùng cửa/mái kính, ánh sáng và góc máy.
7. Chạy `python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/check_production.py --scope pilot --strict`. Khi không có media, báo thiếu là đúng; không có nghĩa đã tạo video.

## Tiếp tục 12 clip

1. Làm lần lượt ảnh S03, S04, S05, S07, S08, S09, duyệt từng ảnh và lưu `INPUT/REFERENCE.png`.
2. Đồng bộ tất cả transition bằng `DONG_BO_INPUT.bat`. S06 và T06 đã nghỉ; giữ ID cũ để khớp hệ thống.
3. Tạo 6 video ambient còn lại và 6 transition còn lại theo prompt đã viết trong mỗi thư mục. Mỗi clip gốc là 8 giây, 16:9, ưu tiên 1080p.
4. Chạy `python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/check_production.py --scope all --strict`.
5. Duyệt bằng mắt từng clip theo `REVIEW_CHECKLIST.md`. Kết quả kiểm tra kỹ thuật **không chứng nhận** video sạch dấu nguồn hay chuyển động đẹp.

## Lệnh hỗ trợ

```powershell
python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/sync_inputs.py --dry-run
python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/sync_inputs.py
python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/check_production.py --scope pilot
python VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools/check_production.py --scope all --strict
python -m unittest discover -s VEO3_PRODUCTION_KIT/06_REGEN_SCENES/tools -p "test_*.py"
```

`--dry-run` không ghi/không xóa input. Đồng bộ thông thường chỉ tác động file khung hình sinh ra trong chính bộ `06_REGEN_SCENES`; sẽ xóa **cặp khung đồng bộ cũ** khi thiếu ảnh nguồn, không xóa video gốc. `INPUT_STATUS.json` là trạng thái ở lần đồng bộ trước, không phải kết quả cập nhật tự động.

## Bàn giao và tích hợp web

Sau khi có 15 clip đã duyệt, mới tiến hành tối ưu tải web (codec, kích thước, preload, retime) và tích hợp theo `04_HANDOFF/INTEGRATION_PLAN.html`. Không đưa vào website các video đang thiếu hoặc chưa duyệt. Mọi chữ, ảnh cá nhân, nón 3D, RSVP vẫn ở lớp React/HTML, không gen vào video.

**Lưu ý:** Prompt không tự loại dấu nhận diện do công cụ tự thêm; cần dùng tùy chọn xuất hợp lệ của nền tảng. Tránh push video lớn/chưa duyệt vào repo.
