export interface SceneDefinition {
  id: string;
  name: string;
  range: [number, number]; // [startProgress, endProgress]
  description: string;
  videoId: string;
  scrollScreens: number;
}

export const SCENES: SceneDefinition[] = [
  {
    id: "hero",
    videoId: "scene-01",
    scrollScreens: 2,
    name: "Thiệp mời",
    range: [0.0, 0.18],
    description: "Video mây và ánh sáng quanh trường, lời mời cùng khung ảnh kỷ niệm",
  },
  {
    id: "campus",
    videoId: "scene-02",
    scrollScreens: 5,
    name: "Kỷ niệm IUH",
    range: [0.18, 0.42],
    description: "Cổng trường đại học IUH và dòng kỷ niệm 4 năm sinh viên",
  },
  {
    id: "ceremony",
    videoId: "scene-03",
    scrollScreens: 1.5,
    name: "Lễ Trao Bằng",
    range: [0.42, 0.6],
    description: "Hội trường sân khấu vinh danh, nhận bằng tốt nghiệp và tung mũ cử nhân",
  },
  {
    id: "event",
    videoId: "scene-04",
    scrollScreens: 1.6,
    name: "Thông tin Lễ",
    range: [0.6, 0.8],
    description: "Lịch trình chi tiết, hội trường E4 và chỉ đường Google Maps",
  },
  {
    id: "wishes",
    videoId: "scene-05",
    scrollScreens: 1.6,
    name: "Lưu bút & RSVP",
    range: [0.8, 1.0],
    description: "Gửi lời chúc mừng, xác nhận tham dự và lời chào tạm biệt",
  },
];

export function getActiveScene(p: number): SceneDefinition {
  const clamped = Math.max(0, Math.min(1, p));
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (clamped >= SCENES[i].range[0]) {
      return SCENES[i];
    }
  }
  return SCENES[0];
}
