'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ArrowDown, ArrowUpRight, CalendarDays, MapPin, GraduationCap } from 'lucide-react';
import { EVENT_DATA } from '@/config/event';
import { smoothstep } from '@/lib/sceneProgress';
import { scrollToProgress } from '../experience/ScrollDirector';

interface InvitationOverlayProps { progress: number; onOpenRSVP: () => void; }

export function InvitationOverlay({ progress, onOpenRSVP }: InvitationOverlayProps) {
  if (progress > 0.19) return null;
  const exit = smoothstep(0.105, 0.18, progress);
  const travel = smoothstep(0, .18, progress);
  return (
    <section aria-label="Thiệp mời lễ tốt nghiệp" className="invitation-overlay" style={{
      opacity: 1 - exit,
      '--hero-travel': travel,
      visibility: exit > 0.98 ? 'hidden' : 'visible',
    } as CSSProperties}>
      <div className="invitation-copy">
        <div className="hero-eyebrow hero-reveal"><span className="status-dot" /> THƯ MỜI TỐT NGHIỆP <span className="eyebrow-year">/ 2026</span></div>
        <p className="hero-preface hero-reveal">Bốn năm thanh xuân. Một ngày đáng nhớ.</p>
        <h1 className="hero-title hero-reveal">Khép một chặng.<br /><em>Mở tương lai.</em></h1>
        <div className="hero-name-block hero-reveal">
          <span className="hero-rule" />
          <div><h2>{EVENT_DATA.graduate.fullName}</h2><p>{EVENT_DATA.graduate.degree}</p></div>
        </div>
        <p className="hero-description hero-reveal">Trân trọng mời thầy cô, gia đình và bạn bè<br className="hidden sm:block" /> cùng đến chia sẻ khoảnh khắc đặc biệt này.</p>
        <div className="hero-actions hero-reveal">
          <button type="button" onClick={onOpenRSVP} className="primary-action">Mình sẽ có mặt <ArrowUpRight size={17} /></button>
          <button type="button" onClick={() => scrollToProgress(0.24)} className="secondary-action">Khám phá hành trình <ArrowDown size={16} /></button>
        </div>
        <div className="hero-facts hero-reveal">
          <span><CalendarDays size={15} />{EVENT_DATA.ceremony.dateDisplay}</span>
          <span><MapPin size={15} />{EVENT_DATA.ceremony.hall} · IUH</span>
        </div>
      </div>
      <div className="portrait-composition">
        <div className="portrait-float">
          <div className="portrait-frame">
            {EVENT_DATA.graduate.invitationPortraitUrl ? <Image
              src={EVENT_DATA.graduate.invitationPortraitUrl}
              alt={`Ảnh tốt nghiệp của ${EVENT_DATA.graduate.fullName}`}
              fill priority sizes="(max-width: 767px) 130px, 350px" className="object-cover"
            /> : <div className="portrait-placeholder" aria-label="Khung ảnh kỷ niệm tốt nghiệp">
              <span className="portrait-monogram">NM</span>
              <GraduationCap size={42} strokeWidth={1} />
              <span className="portrait-year">2026</span>
              <span className="portrait-note">MỘT CỘT MỐC ĐÁNG NHỚ</span>
            </div>}
            <span className="portrait-corner portrait-corner-top" /><span className="portrait-corner portrait-corner-bottom" />
          </div>
          <div className="portrait-caption"><span>THE NEXT CHAPTER</span><strong>Class of <em>2026</em></strong></div>
        </div>
      </div>
    </section>
  );
}
