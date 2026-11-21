import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { EventPoster } from './EventPoster';
import { formatRupiah } from '../lib/ticketRules';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Hitung harga termurah dari tipe tiket
  const prices = event.ticketTypes?.map((t) => Number(t.price)) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Tanggal format Indonesia
  const eventDateObj = new Date(event.startsAt || event.eventDate || Date.now());
  const dateFormatted = eventDateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isSoldOut = event.soldOut || event.isSoldOut;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col bg-charcoal border border-silver-mist/20 hover:border-dusk-rose/60 transition-all duration-300 relative text-left"
    >
      {/* Poster Tarot Rasio 2:3 */}
      <div className="relative w-full">
        <EventPoster id={event.id} title={event.title} />

        {/* Badge SOLD OUT jika kuota habis */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-[2px] flex items-center justify-center p-4 z-20">
            <span className="font-cinzel text-xs tracking-[0.25em] uppercase text-dusk-rose border border-dusk-rose/60 px-3 py-1 bg-charcoal">
              HABIS TERJUAL
            </span>
          </div>
        )}
      </div>

      {/* Konten Keterangan Event */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-3 bg-charcoal">
        {/* Tanggal & Lokasi */}
        <div className="flex items-center justify-between text-[11px] font-inter text-silver-mist/70 tracking-wider">
          <span>{dateFormatted}</span>
          <span className="truncate max-w-[120px] text-right">{event.location}</span>
        </div>

        {/* Judul Event: TAMPIL LENGKAP TANPA TRUNCATION "..." */}
        <h3 className="font-cinzel text-sm leading-snug tracking-[0.03em] text-ivory group-hover:text-dusk-rose transition-colors duration-200">
          {event.title}
        </h3>

        {/* Garis pemisah tipis */}
        <div className="h-[1px] w-full bg-silver-mist/10" />

        {/* Harga & Aksi */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="block text-[10px] uppercase font-inter text-silver-mist/60 tracking-wider">
              Mulai dari
            </span>
            <span className="font-inter font-semibold text-sm text-dusk-rose">
              {formatRupiah(minPrice)}
            </span>
          </div>

          <span className="font-cinzel text-[11px] tracking-[0.15em] uppercase text-silver-mist/70 group-hover:text-ivory group-hover:underline underline-offset-4 transition-all">
            Lihat Tiket →
          </span>
        </div>
      </div>
    </Link>
  );
};
