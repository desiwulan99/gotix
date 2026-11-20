import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const minPrice = event.ticketTypes.length > 0
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0;

  const formattedDate = new Date(event.eventDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col bg-charcoal border border-royal-plum/40 hover:border-muted-violet/60 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-royal-plum/10 relative"
    >
      {/* Sold Out Badge */}
      {event.isSoldOut && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
          SOLD OUT
        </div>
      )}

      {/* Poster Image */}
      <div className="h-48 w-full overflow-hidden bg-obsidian relative">
        <img
          src={event.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent"></div>
      </div>

      {/* Event Details */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-bold font-cinzel text-ivory-white group-hover:text-silver-mist transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-silver-mist/70 mt-2 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-royal-plum/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-silver-mist/80">
            <Calendar className="w-3.5 h-3.5 text-muted-violet shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-silver-mist/80">
            <MapPin className="w-3.5 h-3.5 text-muted-violet shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-silver-mist/60 flex items-center gap-1">
              <Ticket className="w-3 h-3 text-muted-violet" />
              Mulai dari
            </span>
            <span className="text-sm font-bold text-ivory-white font-cinzel">
              Rp {minPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
