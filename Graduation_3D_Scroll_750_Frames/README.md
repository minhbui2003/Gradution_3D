# Graduation 3D — 750 WebP scroll frames

**Bộ đã tạo từ 5 video người dùng gửi.**

- `public/sequences/`: 5 cảnh, mỗi cảnh 150 WebP 1280×720.
- `sequences-manifest.json`: định nghĩa chuỗi và khoảng cuộn.
- `preview/index.html`: demo cuộn 5 cảnh (không có các giao diện tương tác).
- `src/components/experience/FrameSequenceCanvas.tsx`: mã React mẫu, chưa được merge vào repo.
- `docs/AGENT_HANDOFF.md`: bàn giao chi tiết cho AI Agent.
- `qa/`: ảnh kiểm tra toàn bộ cảnh và 4 đoạn nối.

**Thử demo:** giải nén, mở terminal tại thư mục gốc, chạy `python -m http.server 8000` rồi vào `http://localhost:8000/preview/`.

**Lưu ý:** chưa sửa/push repository.
