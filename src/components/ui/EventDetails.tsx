'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Download,
  CalendarPlus,
  ExternalLink,
  X,
  Camera,
  Award,
  GraduationCap,
  Heart,
} from 'lucide-react';
import { EVENT_DATA } from '@/config/event';

interface EventDetailsProps {
  progress: number;
}

export function EventDetails({ progress }: EventDetailsProps) {
  const [showMapModal, setShowMapModal] = useState(false);

  // Visible in Scene 4: 0.60 to 0.80
  const isVisible = progress >= 0.59 && progress <= 0.81;
  if (!isVisible) return null;

  // Calendar .ics download generator
  const downloadICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IUH Graduation//Minh Bui//VI',
      'BEGIN:VEVENT',
      `SUMMARY:Lễ Tốt Nghiệp Cử Nhân - ${EVENT_DATA.graduate.fullName}`,
      `DESCRIPTION:Tham dự Lễ tốt nghiệp Cử nhân Công nghệ Thông tin tại Trường ĐH Công nghiệp TP.HCM (IUH)`,
      `LOCATION:${EVENT_DATA.ceremony.venueName}, ${EVENT_DATA.ceremony.address}`,
      'DTSTART:20261125T000000Z', // 07:00 UTC+7 -> 00:00 UTC
      'DTEND:20261125T043000Z',   // 11:30 UTC+7 -> 04:30 UTC
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Le_Tot_Nghiep_Bui_Tat_Nhut_Minh.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Lễ Tốt Nghiệp - ${EVENT_DATA.graduate.fullName}`
  )}&dates=20261125T000000Z/20261125T043000Z&details=${encodeURIComponent(
    `Lễ Tốt Nghiệp Cử Nhân CNTT - ${EVENT_DATA.graduate.fullName} tại ${EVENT_DATA.ceremony.hall}`
  )}&location=${encodeURIComponent(EVENT_DATA.ceremony.address)}`;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'camera':
        return <Camera size={16} className="text-iuh" />;
      case 'award':
        return <Award size={16} className="text-gold" />;
      case 'graduation-cap':
        return <GraduationCap size={16} className="text-iuh" />;
      case 'heart':
        return <Heart size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4 z-20">
      <div className="w-full max-w-2xl mx-auto glass-panel p-5 sm:p-7 rounded-3xl border border-gold/40 shadow-2xl pointer-events-auto max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="inline-block px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
            Thông tin chi tiết buổi lễ
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            {EVENT_DATA.ceremony.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            {EVENT_DATA.ceremony.dateDisplay} • {EVENT_DATA.ceremony.timeDisplay}
          </p>
        </div>

        {/* Schedule timeline */}
        <div className="mb-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
            <Clock size={14} />
            <span>Lịch trình buổi lễ</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EVENT_DATA.schedule.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-gold/30 transition-colors flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-navy/80 shrink-0 mt-0.5 border border-white/10">
                  {getIcon(item.icon)}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gold block">{item.time}</span>
                  <h5 className="text-xs font-semibold text-white">{item.title}</h5>
                  <p className="text-[11px] text-gray-300 leading-snug mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-deep to-navy border border-gold/30 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-iuh/20 text-iuh shrink-0">
              <MapPin size={22} className="text-gold" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{EVENT_DATA.ceremony.venueName}</h4>
              <p className="text-xs text-gray-300 mt-0.5">{EVENT_DATA.ceremony.address}</p>

              {/* Venue Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={() => setShowMapModal(true)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-gray-200 font-medium transition-colors flex items-center gap-1.5"
                >
                  <MapPin size={13} />
                  <span>Xem bản đồ vệ tinh</span>
                </button>
                <a
                  href={EVENT_DATA.ceremony.googleMapsDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-iuh/30 hover:bg-iuh/50 text-xs text-blue-200 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Navigation size={13} />
                  <span>Chỉ đường Maps</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Add Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
          <span className="text-xs text-gray-300">Lưu lịch vào điện thoại:</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-iuh hover:bg-iuh-light text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <CalendarPlus size={14} />
              <span>Google Calendar</span>
            </a>
            <button
              onClick={downloadICS}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gold text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-gold/30"
            >
              <Download size={14} />
              <span>Tải file .ics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Google Maps Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-2xl bg-navy rounded-3xl border border-gold/40 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-gold" />
                <span className="text-sm font-bold text-white">Vị trí Hội trường E4 - Đại học IUH</span>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="w-full h-80 sm:h-96 bg-gray-900">
              <iframe
                src={EVENT_DATA.ceremony.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
