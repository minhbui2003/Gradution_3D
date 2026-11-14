'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  CalendarPlus,
  ExternalLink,
  X,
  Camera,
  Award,
  GraduationCap,
  Heart,
  Maximize2,
  Navigation as NavigationIcon,
} from 'lucide-react';
import { EVENT_DATA } from '@/config/event';

interface EventDetailsProps {
  progress: number;
}

// Convert ISO date string to UTC format for iCalendar: YYYYMMDDTHHMMSSZ
function formatICSDate(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

export function EventDetails({ progress }: EventDetailsProps) {
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Visible in Scene 4: 0.60 to 0.80
  const isVisible = progress >= 0.59 && progress <= 0.81;
  if (!isVisible) return null;

  // Derive RFC 5545 dates from central EVENT_DATA config
  const startUTC = formatICSDate(EVENT_DATA.ceremony.isoDate);
  const endUTC = formatICSDate(EVENT_DATA.ceremony.isoEndDate);

  const downloadICS = () => {
    const uid = `iuh-grad-${Date.now()}@buitatnhutminh.vn`;
    const dtstamp = formatICSDate(new Date().toISOString());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IUH Graduation//Minh Bui//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${startUTC}`,
      `DTEND:${endUTC}`,
      `SUMMARY:${EVENT_DATA.ceremony.title} - ${EVENT_DATA.graduate.fullName}`,
      `DESCRIPTION:Trân trọng kính mời tham dự Lễ tốt nghiệp cử nhân của ${EVENT_DATA.graduate.fullName} tại ${EVENT_DATA.ceremony.hall}.`,
      `LOCATION:${EVENT_DATA.ceremony.venueName}, ${EVENT_DATA.ceremony.address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Le_Tot_Nghiep_${EVENT_DATA.graduate.nickName || 'Minh'}_2026.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Google Calendar Web Intent Link
  const gCalDates = `${startUTC}/${endUTC}`;
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${EVENT_DATA.ceremony.title} - ${EVENT_DATA.graduate.fullName}`
  )}&dates=${gCalDates}&details=${encodeURIComponent(
    `Trân trọng kính mời tham dự Lễ tốt nghiệp cử nhân của ${EVENT_DATA.graduate.fullName}.\nĐịa điểm: ${EVENT_DATA.ceremony.hall}\nĐịa chỉ: ${EVENT_DATA.ceremony.address}`
  )}&location=${encodeURIComponent(
    `${EVENT_DATA.ceremony.venueName}, ${EVENT_DATA.ceremony.address}`
  )}`;

  const getIcon = (name: string) => {
    switch (name) {
      case 'camera':
        return <Camera size={14} className="text-gold" />;
      case 'award':
        return <Award size={14} className="text-gold" />;
      case 'graduation-cap':
        return <GraduationCap size={14} className="text-gold" />;
      case 'heart':
        return <Heart size={14} className="text-gold" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-3 sm:p-6 z-20 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto glass-panel p-4 sm:p-6 rounded-3xl border border-gold/40 shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto backdrop-blur-md">
        {/* Section Header */}
        <div className="text-center mb-4 pb-2 border-b border-white/10">
          <span className="inline-block px-3 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
            Thông tin Lễ Tốt Nghiệp & Bản đồ Chỉ đường
          </span>
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-white tracking-wide">
            {EVENT_DATA.ceremony.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
            {EVENT_DATA.ceremony.dateDisplay} • {EVENT_DATA.ceremony.timeDisplay}
          </p>
        </div>

        {/* 2-Column Responsive Layout: Left Timeline & Actions | Right Real Google Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* LEFT: Timeline & Calendar Actions */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Clock size={14} />
              <span>Lịch trình buổi lễ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EVENT_DATA.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-gold/30 transition-colors flex items-start gap-2.5"
                >
                  <div className="p-1.5 rounded-xl bg-navy/80 shrink-0 mt-0.5 border border-white/10">
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gold block">{item.time}</span>
                    <h5 className="text-[11px] font-semibold text-white">{item.title}</h5>
                    <p className="text-[10px] text-gray-300 leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Venue Address Box */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-navy-deep to-navy border border-gold/30 text-left">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-iuh/20 text-gold shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white">{EVENT_DATA.ceremony.venueName}</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">{EVENT_DATA.ceremony.address}</p>
                </div>
              </div>
            </div>

            {/* Add to Calendar Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
              >
                <CalendarPlus size={13} className="text-gold" />
                <span>Google Calendar</span>
              </a>
              <button
                onClick={downloadICS}
                className="flex-1 py-2 px-3 rounded-full bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download size={13} />
                <span>Tải file .ICS</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Real Interactive Google Maps Embed with Scroll Isolation */}
          <div
            className="flex flex-col gap-2 rounded-2xl p-2.5 bg-navy-deep/80 border border-gold/30 shadow-inner"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider">
                <MapPin size={13} />
                <span>Bản đồ vị trí IUH Hội trường E4</span>
              </div>
              <button
                onClick={() => setIsMapExpanded(true)}
                className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Phóng to bản đồ"
              >
                <Maximize2 size={13} />
              </button>
            </div>

            {/* Maps Iframe */}
            <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-white/15 bg-navy shadow-md">
              <iframe
                title="Bản đồ IUH Hội trường E4"
                src={EVENT_DATA.ceremony.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Direct Directions Action Link */}
            <div className="flex items-center justify-between px-1 pt-1 text-[11px]">
              <span className="text-gray-300 truncate max-w-[200px]">
                {EVENT_DATA.ceremony.address}
              </span>
              <a
                href={EVENT_DATA.ceremony.googleMapsDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline flex items-center gap-1 font-semibold shrink-0"
              >
                <NavigationIcon size={11} />
                <span>Chỉ đường trực tiếp</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Map Fullscreen Modal */}
      {isMapExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMapExpanded(false);
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-4xl bg-navy rounded-3xl border border-gold/50 p-4 shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-gold" />
                <h4 className="text-sm font-serif font-bold text-white">
                  Bản đồ vị trí: {EVENT_DATA.ceremony.venueName}
                </h4>
              </div>
              <button
                onClick={() => setIsMapExpanded(false)}
                aria-label="Đóng bản đồ"
                className="p-1.5 rounded-full text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-80 sm:h-[450px] rounded-2xl overflow-hidden border border-white/10">
              <iframe
                title="Bản đồ IUH Hội trường E4"
                src={EVENT_DATA.ceremony.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 text-xs text-gray-300">
              <span>{EVENT_DATA.ceremony.address}</span>
              <a
                href={EVENT_DATA.ceremony.googleMapsDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Mở trong ứng dụng Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
