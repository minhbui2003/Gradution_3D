import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://gradution.btnminh.me'),
  title: 'Lễ Tốt Nghiệp 2026 - Bùi Tất Nhựt Minh | IUH Khoa CNTT',
  description: 'Trân trọng kính mời quý thầy cô, gia đình và bạn bè đến tham dự Lễ tốt nghiệp Cử nhân Công nghệ Thông tin tại Trường Đại học Công nghiệp TP.HCM (IUH).',
  keywords: ['Lễ tốt nghiệp', 'IUH', 'Bùi Tất Nhựt Minh', 'Khoa Công nghệ Thông tin', 'Graduation 2026'],
  openGraph: {
    title: 'Thiệp Mời Lễ Tốt Nghiệp 2026 - Bùi Tất Nhựt Minh',
    description: 'Hành trình 4 năm rực rỡ tại IUH. Kính mời quý thầy cô và bạn bè đến chia vui cùng Nhựt Minh vào ngày 25/11/2026 tại Hội trường E4 IUH.',
    images: ['/images/memory_1.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="icon" href="/images/chibi_avatar.png" type="image/png" />
      </head>
      <body className="antialiased selection:bg-gold selection:text-navy min-h-screen">
        {children}
      </body>
    </html>
  );
}
