import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const minPrice =
    event.ticketTypes.length > 0
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
      className="group flex flex-col bg-white border border-soft-gray hover:border-dusty-purple/60 rounded-2xl overflow-hidden shadow-soft-card hover:shadow-soft-hover transition-all duration-300 relative"
    >
      {/* Sold Out Badge */}
      {event.isSoldOut && (
        <div className="absolute top-3.5 right-3.5 z-10 px-3 py-1 rounded-full bg-white/95 border border-red-200 text-red-600 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm shadow-sm">
          SOLD OUT
        </div>
      )}

      {/* Poster Image with Subtle Zoom */}
      <div className="h-52 w-full overflow-hidden bg-pearl relative">
        <img
          src={
            event.imageUrl ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
          }
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent"></div>
      </div>

      {/* Event Details */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-base font-bold font-cinzel text-charcoal group-hover:text-plum transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-muted-charcoal mt-2 line-clamp-2 leading-relaxed font-light">
            {event.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-soft-gray/60 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Calendar className="w-3.5 h-3.5 text-royal-mauve shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <MapPin className="w-3.5 h-3.5 text-royal-mauve shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-soft-gray/40">
            <span className="text-[11px] uppercase tracking-wider text-secondary flex items-center gap-1 font-medium">
              <Ticket className="w-3.5 h-3.5 text-dusty-purple" />
              Mulai dari
            </span>
            <span className="text-sm font-bold text-charcoal font-cinzel">
              Rp {minPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
