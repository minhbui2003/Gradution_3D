# THAO TAC TRIPO AI - TUNG BUOC

1. Mo https://studio.tripo3d.ai va dang nhap.
2. Chon `Best Quality / HD Model` neu uu tien chi tiet, hoac `Clean Topology / Smart Mesh` neu can mesh de rig / toi uu. Tai khoan Free co the bi han che xuat nhung dong model moi.
3. Vao `Image to 3D`; chi upload 1 anh vat the da duoc tach nen thich hop. Khong dua anh concept tong hop (co chibi, mu, cong, may, logo, chu...).
4. Neu hinh dang phuc tap, chon `Multi-view`: 2-4 anh front, side, back, 3/4 da duoc tao dung cung mot thiet ke, cung pose/crop/chieu sang.
5. Cac vat the tinh dung standard/2K texture la diem bat dau; khong can 8K. Neu Smart Mesh co polycount thi can cho vat the nho, tang neu can.
6. Bam `Generate`; xoay viewer kiem tra day du mat sau, khong bi xuyen mesh, khong thua vat the, mau xanh-vang dung.
7. Neu can sua mesh: `Segmentation`, `Retopology`, `Texture` (tuy credits/plan). Model phong bi nen tach nap roi, model chibi can khong cam mu va bang de cho canh animation.
8. Với chibi: `Rig` > `Humanoid` > preset `Mixamo`/`Unity Humanoid` > tao rig > xem khop vai, co tay, dau goi > `Animate` them Idle/Walk/Wave/Celebrate neu co. Chi xuat khi cac khop chay on.
9. `Export / Export & DCC`: cho vat the tinh chon `GLB` + texture; cho chibi da rig nen xuat `FBX` de co workflow chinh sua rig/animation trong Blender, roi tu Blender xuat `GLB` cho web.
10. Mo file GLB trong Blender hoac viewer, kiem tra kich thuoc, pivot, huong truc, texture, clip. Dat ten file nhu trong bang asset.
11. Copy model vao `public/models/` trong repo web. Khong viet ten file ao neu chua tao.

### Ghi chu khi lam web
- File GLB KHONG tu biet di chuyen khi nguoi dung scroll. AI coding agent phai dung GSAP/R3F de dieu khien camera/object transform.
- Nhac nen va loi chuc/RSVP dung HTML/UI, khong can thanh model 3D.
- Toa nha tu mot anh goc thap la tham chieu phong cach; de di camera qua mat sau can them anh nhieu goc hoac model dung lai bang Blender.

Nguon: https://www.tripo3d.ai/product-doc/model-generation/image-to-3d ; https://www.tripo3d.ai/product-doc/model-generation/multi-view-to-3d ; https://www.tripo3d.ai/product-doc/module-post-processing/rigging-animation ; https://www.tripo3d.ai/product-doc/export-and-integration/export-dcc
