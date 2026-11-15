# SCENE BIBLE — Khóa kiến trúc trước khi tạo 15 video

**Mục đích:** 8 cảnh nền và 7 chuyển cảnh là một chuyến đi trong CÙNG một công trình, không phải 15 ảnh đẹp riêng lẻ. Đọc file này cùng prompt đã có trong từng cảnh và ảnh tham khảo COMPOSITION_ONLY (ảnh tham khảo có thể còn dấu nguồn, không dùng làm input mới).

## Quy định chung

- Ảnh mới: PNG 16:9, ưu tiên 1920x1080, tối thiểu 1280x720. Giữ vùng giữa 32% khung hình đủ rõ để crop dọc trên điện thoại.
- Kiến trúc: xanh navy, kính xanh, tường kem ấm, điểm nhấn vàng nhạt. Không thay bảng màu và cách bố trí cửa giữa hai cảnh.
- Camera: trục giữa, độ cao nhất quán. Ambient đứng yên tuyệt đối; transition là một động tác dolly liên tục.
- Không sinh chữ, logo, biểu tượng trường, nón tốt nghiệp, giao diện, ảnh cá nhân, card hay nút vào nền. Những thứ này phải render bằng website.
- **Tạo S01 và S02 cùng một thiết kế trước**, dùng ảnh vừa duyệt làm tham chiếu hình học cho cảnh kế tiếp; không gen từng cảnh độc lập.

## Mốc kiến trúc bắt buộc

| ID | Vị trí camera | Chi tiết cố định |
|---|---|---|
| S01 | Toàn cảnh ngoài trường | Một mái kính, một cổng navy liền vào mặt tiền, lối giữa |
| S02 | Ngay dưới mái kính | Cùng cổng S01, hành lang kem, cửa đôi cuối hành lang |
| S03 | Đi vào hành lang một bước | Cùng bề ngang, trần cong lệch trái, cửa đôi vẫn đóng |
| S04 | Tiến sâu trong hành lang | Giữ sàn phản chiếu, tường kem, cửa đôi lớn hơn |
| S05 | Sát cửa hội trường | Chính cửa đôi đó, đang ĐÓNG, không có điểm chờ riêng |
| S07 | Trong hội trường nhìn về sân khấu | Màn navy, thảm đỏ, hàng ghế, sân khấu trung tâm trống |
| S08 | Sảnh kính gần hội trường | Có lối ra thực tế từ S07; cửa giữa sảnh đóng |
| S09 | Khu lưu niệm/liên hoan | Liền với cửa sảnh S08, đèn trần và vật liệu đồng bộ |

## Camera chuyển cảnh

- T01: S01 → S02. Tiến từ sân vào dưới mái kính, không tạo thêm cổng/vòm thứ hai.
- T02: S02 → S03. Vào trong hành lang hẹp, không biến thành sảnh rộng.
- T03: S03 → S04. Tiến thẳng, cửa đôi không tự mở.
- T04: S04 → S05. Đến gần cửa, cửa vẫn đóng.
- T05: S05 → S07. **Cửa đôi mở trong khi camera tiến qua**, không dừng giữa chừng.
- T07: S07 → S08. Camera lùi qua cửa hội trường rồi rẽ nhẹ vào sảnh; nếu hành trình quá xa trong 8 giây, sửa bố cục/motion thay vì dùng teleport.
- T08: S08 → S09. Qua cửa sảnh đang mở vào khu tiếp đón; không morph tường thành backdrop.

## Chấp nhận từng cảnh

Kiểm tra 4 góc, biển hiệu, vòm/cửa, trần, vật liệu, chiều sâu, crop dọc, logo/chữ AI, tính liên tục với cảnh liền kề, khung đầu/cuối. Video ambient không zoom/đi lùi; video transition không dissolve/teleport/chèn ảnh cuối giả. Xem toàn bộ 8 giây, không chỉ frame đầu/cuối.

**Quyết định production:** Chỉ tiếp tục 12 clip còn lại sau khi đã duyệt S01_AMBIENT, T01 và S02_AMBIENT. Tất cả video cuối cùng vẫn cần duyệt bằng mắt.
