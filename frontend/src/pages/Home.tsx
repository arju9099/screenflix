import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlayCircle, Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';

interface Movie {
  _id: string;
  title: string;
  posterUrl: string;
  genre: string;
  runtime: string;
  imdbRating: string;
}

export default function Home() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [latest, setLatest] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCity } = useLocation();

  useEffect(() => {
    setLoading(true);
    const api = (sort: string, limit: number) => {
       const cityParam = selectedCity ? `city=${selectedCity}&` : '';
       return axios.get(`/api/movies?${cityParam}sort=${sort}&limit=${limit}`);
    };
    
    Promise.all([
      api('rating', 10),
      api('latest', 20)
    ]).then(([resTrending, resLatest]) => {
      setTrending(resTrending.data);
      setLatest(resLatest.data);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, [selectedCity]);

  if (loading) {
    return <div className="flex justify-center mt-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;
  }

  const MovieGrid = ({ title, movies, city }: { title: string, movies: Movie[], city?: string }) => (
    <div className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <h2 className="text-3xl font-black text-white tracking-tighter uppercase border-l-4 border-red-600 pl-4">{title}</h2>
           {city && movies.length > 0 && (
             <div className="flex items-center gap-2 bg-red-600/10 text-red-500 px-4 py-1.5 rounded-full border border-red-600/20">
                <MapPin size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{city}</span>
             </div>
           )}
        </div>
      </div>
      
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {movies.map(movie => (
            <Link key={movie._id} to={`/movie/${movie._id}`} className="group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden aspect-[2/3] bg-gray-800 shadow-2xl transition duration-500 group-hover:scale-105 group-hover:shadow-red-600/20 group-hover:border-red-600/30 border border-transparent">
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="w-full h-full object-cover transition duration-500 group-hover:opacity-60"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500 flex flex-col justify-end">
                  <div className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full self-center shadow-2xl shadow-red-600/50 transform translate-y-8 group-hover:translate-y-0 transition duration-500">
                    <PlayCircle size={24} />
                  </div>
                </div>
                {movie.imdbRating && (
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 border border-white/10 text-yellow-500 shadow-2xl">
                    <Star size={11} className="fill-yellow-500"/> {movie.imdbRating}
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="font-black text-white leading-tight line-clamp-1 group-hover:text-red-500 transition">{movie.title}</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>{movie.runtime}</span>
                  <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
                  <span className="truncate">{movie.genre.split(',')[0]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border-2 border-dashed border-gray-800 rounded-[3rem] p-24 text-center">
           <MapPin size={32} className="text-gray-800 mx-auto mb-4" />
           <p className="text-gray-500 font-bold text-sm">No shows available in {city || 'this area'}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Hero Banner */}
      <div className="relative rounded-[3rem] overflow-hidden min-h-[45vh] bg-gray-800 flex items-center shadow-2xl border border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10" />
        <div className="relative z-20 p-12 md:p-20 max-w-2xl">
          <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-6 inline-block shadow-lg shadow-red-600/30">Premiere</span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] mb-6 tracking-tighter">
            THE MAGIC OF THE BIG SCREEN.
          </h1>
          <p className="text-gray-400 text-lg mb-10 font-bold leading-relaxed">Discover, book, and enjoy the latest global blockbusters at ScreenFlix. Premium experiences, every time.</p>
          <div className="flex gap-4">
             <div className="w-12 h-1 bg-red-600 rounded-full"></div>
             <div className="w-4 h-1 bg-gray-700 rounded-full"></div>
             <div className="w-4 h-1 bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="mt-20 px-2 lg:px-0">
        <MovieGrid title="Trending Now" movies={trending} city={selectedCity} />
        <MovieGrid title="Latest Releases" movies={latest} city={selectedCity} />
      </div>
    </div>
  );
}
