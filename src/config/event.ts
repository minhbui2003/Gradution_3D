export interface EventConfig {
  graduate: {
    fullName: string;
    nickName?: string;
    degree: string;
    major: string;
    faculty: string;
    university: string;
    classCode: string;
    studentId: string;
    avatarUrl: string;
    portraitUrl?: string;
    quote: string;
  };
  ceremony: {
    title: string;
    dateDisplay: string; // e.g. "Thứ Tư, 25 Tháng 11, 2026"
    isoDate: string; // "2026-11-25T07:00:00"
    isoEndDate: string; // "2026-11-25T11:30:00"
    timeDisplay: string; // "07:00 - 11:30"
    venueName: string; // "Hội trường E4 - Trường Đại học Công nghiệp TP.HCM"
    hall: string; // "Hội trường E4"
    address: string; // "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh"
    googleMapsEmbedUrl: string;
    googleMapsDirectUrl: string;
  };
  schedule: Array<{
    time: string;
    title: string;
    description: string;
    icon: string;
  }>;
  stories: Array<{
    id: string;
    year: string;
    title: string;
    description: string;
    imageUrl: string;
  }>;
}

export const EVENT_DATA: EventConfig = {
  graduate: {
    fullName: "Bùi Tất Nhựt Minh",
    nickName: "Minh",
    degree: "Cử nhân Công nghệ Thông tin",
    major: "Kỹ thuật Phần mềm / Công nghệ Thông tin",
    faculty: "Khoa Công nghệ Thông tin",
    university: "Trường Đại học Công nghiệp TP.HCM (IUH)",
    classCode: "DHCNTT",
    studentId: "IUH-GRAD-2026",
    avatarUrl: "/images/chibi_avatar.png",
    portraitUrl: "/images/portrait.png",
    quote: "Hành trình 4 năm rực rỡ dưới mái trường IUH khép lại để mở ra những chân trời mới. Trân trọng kính mời thầy cô, gia đình và bạn bè cùng đến chia vui!",
  },
  ceremony: {
    title: "LỄ TỐT NGHIỆP CỬ NHÂN NĂM 2026",
    dateDisplay: "Thứ Tư, 25 Tháng 11, 2026",
    isoDate: "2026-11-25T07:00:00+07:00",
    isoEndDate: "2026-11-25T11:30:00+07:00",
    timeDisplay: "07:00 - 11:30",
    venueName: "Hội trường E4 - Trường Đại học Công nghiệp TP.HCM",
    hall: "Hội trường E4",
    address: "Số 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.8581691238473!2d106.68427047583856!3d10.822164158348827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174deb3ef536f31%3A0x8b7bb8b7c956157b!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBDw7RuZyBuZ2hp4buHcCBUUC5IQ00!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s",
    googleMapsDirectUrl: "https://maps.app.goo.gl/3q4a7c8d9e",
  },
  schedule: [
    {
      time: "07:00 - 07:30",
      title: "Đón tiếp & Check-in",
      description: "Chào đón quý thầy cô, gia đình, bạn bè chụp ảnh kỷ niệm tại photobooth sảnh E4.",
      icon: "camera",
    },
    {
      time: "07:30 - 08:15",
      title: "Khai mạc buổi lễ",
      description: "Nghi thức chào cờ, phát biểu của Ban Giám hiệu Nhà trường và đại diện Khoa CNTT.",
      icon: "award",
    },
    {
      time: "08:15 - 10:15",
      title: "Xướng tên & Trao bằng",
      description: "Khoảnh khắc vinh danh các tân cử nhân nhận bằng tốt nghiệp trên sân khấu chính.",
      icon: "graduation-cap",
    },
    {
      time: "10:15 - 11:30",
      title: "Tung mũ & Chụp ảnh lưu niệm",
      description: "Nghi thức tung mũ cử nhân truyền thống và chụp ảnh cùng người thân, bạn bè trong khuôn viên trường.",
      icon: "heart",
    },
  ],
  stories: [
    {
      id: "story-1",
      year: "Năm 1",
      title: "Bước chân đầu tiên tại IUH",
      description: "Những ngày đầu bỡ ngỡ bước vào giảng đường, làm quen với những dòng code 'Hello World' đầu tiên.",
      imageUrl: "/images/memory_1.png",
    },
    {
      id: "story-2",
      year: "Năm 2",
      title: "Cháy hết mình với Đồ án & CLB",
      description: "Những đêm thức trắng cùng đồng đội gõ phím, những buổi sinh hoạt câu lạc bộ gắn kết tình bạn.",
      imageUrl: "/images/memory_2.png",
    },
    {
      id: "story-3",
      year: "Năm 3",
      title: "Chinh phục kỳ Thực tập Doanh nghiệp",
      description: "Bước ra khỏi vùng an toàn, trải nghiệm môi trường kỹ sư phần mềm thực thụ và tích lũy kinh nghiệm.",
      imageUrl: "/images/memory_3.png",
    },
    {
      id: "story-4",
      year: "Năm 4",
      title: "Khoá luận Tốt nghiệp & Chạm tới Ước mơ",
      description: "Bảo vệ thành công khoá luận tốt nghiệp, chính thức đón nhận danh hiệu Tân Cử nhân Công nghệ Thông tin.",
      imageUrl: "/images/memory_4.png",
    },
  ],
};
