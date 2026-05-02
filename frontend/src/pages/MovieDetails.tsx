import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, Star, Calendar, MapPin } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

interface Movie {
  _id: string;
  title: string;
  posterUrl: string;
  genre: string;
  runtime: string;
  imdbRating: string;
  plot: string;
  director: string;
  actors: string;
}

interface ShowTime {
  _id: string;
  movieId: string;
  theaterId: {
    _id: string;
    name: string;
    location: string;
    city: string;
  };
  screen: string;
  startTime: string;
  ticketPrice: number;
}

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const { selectedCity } = useLocation();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<ShowTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate next 4 dates starting from today
  const dates = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    setLoading(true);
    // Fetch movie and showtimes
    Promise.all([
      axios.get(`/api/movies/${id}`).catch(() => null),
      axios.get(`/api/showtimes/movie/${id}`).catch(() => null)
    ]).then(([movieRes, showtimesRes]) => {
      if (movieRes?.data) setMovie(movieRes.data);
      if (showtimesRes?.data) setShowtimes(showtimesRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center mt-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;
  if (!movie) return <div className="text-center mt-20 text-xl text-gray-500 font-medium">Movie not found</div>;

  const targetDate = dates[selectedDateIndex];
  
  // Filtering logic
  const filteredShowtimes = showtimes.filter(st => {
    const stTime = new Date(st.startTime);
    const now = new Date();
    
    // 1. Date Matching
    const stDate = new Date(st.startTime);
    stDate.setHours(0, 0, 0, 0);
    const dateMatch = stDate.getTime() === targetDate.getTime();
    
    // 2. Time Matching (Hide past shows for today)
    const isFutureShow = stTime.getTime() > now.getTime();
    
    // 3. Metadata Filters
    const cityMatch = !selectedCity || st.theaterId.city.toLowerCase().includes(selectedCity.toLowerCase());
    const localMatch = !localSearch || (
      st.theaterId.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      st.theaterId.location.toLowerCase().includes(localSearch.toLowerCase())
    );
    
    return dateMatch && isFutureShow && cityMatch && localMatch;
  });

  // Group showtimes: Theater -> Screen -> Shows
  const groupedByTheater = filteredShowtimes.reduce((acc, st) => {
    const tId = st.theaterId._id;
    if (!acc[tId]) {
      acc[tId] = {
        theater: st.theaterId,
        screens: {}
      };
    }
    
    const screenName = st.screen || 'Screen 1';
    if (!acc[tId].screens[screenName]) {
      acc[tId].screens[screenName] = [];
    }
    
    acc[tId].screens[screenName].push(st);
    return acc;
  }, {} as any);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 pb-20">
      {/* Movie Info Section */}
      <div className="flex flex-col md:flex-row gap-10 mt-10 mb-16">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900 group">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-auto object-cover group-hover:scale-105 transition duration-700" />
          </div>
        </div>
        
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white">{movie.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold mb-8">
            <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full border border-yellow-500/20">
              <Star size={18} className="fill-yellow-500"/> {movie.imdbRating}
            </div>
            <div className="flex items-center gap-1.5 bg-gray-800 text-gray-200 px-4 py-2 rounded-full border border-gray-700">
              <Clock size={16} /> {movie.runtime}
            </div>
            <div className="bg-red-600/10 text-red-500 px-4 py-2 rounded-full border border-red-500/20 uppercase tracking-widest text-[10px]">
              {movie.genre}
            </div>
          </div>
          
          <div className="space-y-6">
            <p className="text-xl leading-relaxed text-gray-400 font-medium italic opacity-80">"{movie.plot}"</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-gray-800">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-1">Director</p>
                <p className="text-white font-bold">{movie.director}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-1">Star Cast</p>
                <p className="text-white font-bold">{movie.actors}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="sticky top-16 z-30 bg-black/90 backdrop-blur-xl py-6 -mx-4 px-4 border-b border-white/5 shadow-2xl mb-12">
        <div className="flex gap-3 overflow-x-auto no-scrollbar max-w-6xl mx-auto items-center">
          <div className="text-gray-500 mr-2 flex flex-col items-center">
            <Calendar size={20} className="mb-0.5 opacity-50" />
            <span className="text-[8px] uppercase font-black tracking-widest opacity-40">date</span>
          </div>
          {dates.map((date, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDateIndex(idx)}
              className={`flex flex-col items-center min-w-[65px] py-2 px-1 rounded-xl transition-all duration-500 border ${
                selectedDateIndex === idx 
                ? 'bg-white border-white text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-105' 
                : 'bg-gray-900/40 border-white/10 text-gray-400 hover:border-white/30 hover:bg-gray-800'
              }`}
            >
              <span className={`text-[9px] uppercase font-black tracking-tight mb-0.5 ${selectedDateIndex === idx ? 'opacity-70' : 'opacity-50'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-lg font-black leading-none">
                {date.getDate()}
              </span>
              <span className={`text-[8px] uppercase font-black tracking-tighter mt-1 ${selectedDateIndex === idx ? 'opacity-60' : 'opacity-40'}`}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Showtimes Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="w-2 h-8 bg-red-600 rounded-full"></div>
          Showtimes
        </h2>
        
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search theaters or area..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Grouped Lists */}
      {Object.keys(groupedByTheater).length === 0 ? (
        <div className="bg-gray-900/50 rounded-3xl p-20 border border-gray-800 text-center">
          <Calendar className="mx-auto text-gray-700 mb-6" size={48} />
          <h3 className="text-2xl font-bold text-gray-400">No shows available for this day</h3>
          <p className="text-gray-600 mt-2">Try selecting a different date or city.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {Object.values(groupedByTheater).map((data: any) => (
            <div key={data.theater._id} className="bg-gray-900/50 rounded-3xl border border-gray-800 overflow-hidden hover:border-gray-700 transition duration-300">
              <div className="p-8 border-b border-gray-800 bg-gray-900/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-600/10 rounded-2xl text-red-500 border border-red-500/20">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{data.theater.name}</h3>
                    <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-tight">
                       {data.theater.location}, {data.theater.city}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-10">
                {Object.entries(data.screens).map(([screenName, shows]: any) => (
                  <div key={screenName}>
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-3">
                      <ChevronRight size={14} className="text-red-600" />
                      {screenName}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {shows.map((st: any) => (
                        <Link 
                          key={st._id}
                          to={`/book/${st._id}`}
                          className="flex flex-col items-center justify-center min-w-[120px] bg-gray-800 border border-gray-700 hover:border-red-600 hover:bg-red-600 p-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-red-600/20 group"
                        >
                          <span className="text-xl font-black text-white group-hover:text-white mb-1">
                            {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-black text-gray-500 group-hover:text-red-100 uppercase tracking-tighter">
                            ₹{st.ticketPrice} • available
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper icon
function ChevronRight({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
