import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MapPin, ChevronDown, X, Lock } from 'lucide-react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';

export default function LocationBar() {
  const { selectedCity, setSelectedCity } = useLocation();
  const [cities, setCities] = useState<string[]>([]);
  const routerLocation = useRouterLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const isHomePage = routerLocation.pathname === '/';
  // Allow changing only if on home page OR if no city is selected yet
  const canSelectionBeChanged = isHomePage || !selectedCity;

  useEffect(() => {
    axios.get('/api/theaters/cities')
      .then(res => setCities(res.data))
      .catch(err => console.error('Error fetching cities:', err));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = cities.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const choose = (city: string) => {
    setSelectedCity(city);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="bg-gray-850 border-b border-gray-700/60 bg-gray-900/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3" ref={ref}>
        <MapPin size={16} className="text-red-400 shrink-0" />
        <span className="text-gray-400 text-sm shrink-0">Showing shows in:</span>

        <div className="relative">
          <button
            onClick={() => canSelectionBeChanged && setOpen(o => !o)}
            disabled={!canSelectionBeChanged}
            className={`flex items-center gap-1.5 font-semibold text-sm transition ${canSelectionBeChanged ? 'text-white hover:text-red-400 cursor-pointer' : 'text-gray-400 cursor-default opacity-60'}`}
          >
            {selectedCity || <span className="text-gray-400 font-normal animate-pulse">Select your city</span>}
            {canSelectionBeChanged ? (
              <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            ) : (
              <Lock size={12} className="text-gray-600 ml-1" />
            )}
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 border-b border-gray-700">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search city..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded-lg outline-none border border-gray-700 focus:border-red-500 transition"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-gray-500 text-sm p-3 text-center">No cities found</p>
                ) : filtered.map(city => (
                  <button
                    key={city}
                    onClick={() => choose(city)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-700 ${city === selectedCity ? 'text-red-400 bg-gray-700/50' : 'text-gray-300'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedCity && canSelectionBeChanged && (
          <button
            onClick={() => setSelectedCity('')}
            className="ml-1 flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition"
          >
            <X size={12} /> Clear
          </button>
        )}

        {selectedCity && (
          <span className="ml-auto text-xs text-gray-500 hidden sm:block">
            {canSelectionBeChanged ? 'Discovery Mode' : 'Pinned for Booking'} • <span className="text-red-400 font-medium">{selectedCity}</span>
          </span>
        )}
      </div>
    </div>
  );
}
