import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PlusCircle, Search, Film, Calendar, Clock, X, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [omdbResults, setOmdbResults] = useState<any[]>([]);
  const [localMovies, setLocalMovies] = useState<any[]>([]);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [myTheaters, setMyTheaters] = useState<any[]>([]);
  
  const [showTheaterForm, setShowTheaterForm] = useState(false);
  const [newTheater, setNewTheater] = useState({ name: '', city: '', location: '' });
  const [selectedTheater, setSelectedTheater] = useState<any | null>(null);

  // Showtime modal state
  const [showtimeMovie, setShowtimeMovie] = useState<any | null>(null);
  const [showtimeForm, setShowtimeForm] = useState({ 
    theaterId: '', 
    screen: 'Screen 1', 
    startTime: '', 
    ticketPrice: '150',
    seatsPerRow: 10,
    zones: [{ category: 'Platinum', rows: 'A,B', price: 350 }, { category: 'Gold', rows: 'C,D,E', price: 200 }]
  });
  const [showtimeLoading, setShowtimeLoading] = useState(false);

  useEffect(() => {
    // Fetch local movies
    axios.get('/api/movies').then(res => setLocalMovies(res.data)).catch(() => {});
    
    // If super admin, fetch all theaters for approval
    if (user?.role === 'super_admin') {
      axios.get('/api/theaters/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => setTheaters(res.data)).catch(() => {});
    } else if (user?.role === 'theater_admin') {
      // Fetch all their theaters (any status) for the theaters tab
      axios.get('/api/theaters/mine', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        setTheaters(res.data);
        // Keep only approved ones for showtime scheduling
        setMyTheaters(res.data.filter((t: any) => t.status === 'approved'));
      }).catch(() => {});
    }
  }, [user]);

  const searchOMDB = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.get(`/api/movies/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOmdbResults(res.data);
    } catch (err) {
      alert('Search failed');
    }
  };

  const syncMovie = async (omdbId: string) => {
    try {
      await axios.post('/api/movies/sync', { omdbId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Movie successfully synced to platform!');
      const res = await axios.get('/api/movies');
      setLocalMovies(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Sync failed');
    }
  };

  const openShowtimeModal = (movie: any) => {
    if (myTheaters.length === 0) {
      alert('You have no approved theaters. Please register a theater and wait for Super Admin approval.');
      return;
    }
    setShowtimeMovie(movie);
    setShowtimeForm({ 
      theaterId: myTheaters[0]._id, 
      screen: 'Screen 1', 
      startTime: '', 
      ticketPrice: '150',
      seatsPerRow: 10,
      zones: [{ category: 'Platinum', rows: 'A,B', price: 350 }, { category: 'Gold', rows: 'C,D,E', price: 200 }]
    });
  };

  const submitShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowtimeLoading(true);
    try {
      await axios.post('/api/showtimes', {
        movieId: showtimeMovie._id,
        theaterId: showtimeForm.theaterId,
        screen: showtimeForm.screen,
        startTime: new Date(showtimeForm.startTime).toISOString(),
        ticketPrice: Number(showtimeForm.ticketPrice),
        seatsPerRow: Number(showtimeForm.seatsPerRow),
        layoutConfig: showtimeForm.zones.map(z => ({
          category: z.category,
          rows: z.rows.split(',').map(r => r.trim().toUpperCase()),
          price: Number(z.price)
        }))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`Showtime added successfully! Users can now find your theater for "${showtimeMovie.title}".`);
      setShowtimeMovie(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add showtime');
    } finally {
      setShowtimeLoading(false);
    }
  };

  const deleteMovie = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to completely remove '${title}' from the platform?`)) return;
    try {
      await axios.delete(`/api/movies/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLocalMovies(prev => prev.filter(m => m._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete movie');
    }
  };

  const updateTheaterStatus = async (id: string, status: 'approved' | 'rejected' | 'blocked') => {
    try {
      await axios.put(`/api/theaters/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // refresh
      setTheaters(prev => prev.map(t => t._id === id ? { ...t, status } : t));
    } catch (err) {
      alert('Update failed');
    }
  };

  const submitTheater = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/theaters', newTheater, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Theater registered! Waiting for Super Admin approval.');
      setTheaters([...theaters, res.data]);
      setShowTheaterForm(false);
      setNewTheater({ name: '', city: '', location: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register theater');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">
        Welcome, {user?.name} 
        <span className="ml-3 text-xs bg-red-600 px-2 py-1 rounded-full uppercase tracking-widest align-middle">
          {user?.role.replace('_', ' ')}
        </span>
      </h1>

      <div className="flex border-b border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('movies')}
          className={`py-3 px-6 font-medium ${activeTab === 'movies' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          {user?.role === 'super_admin' ? 'Manage Platform Movies' : 'My Movies'}
        </button>
        <button 
          onClick={() => setActiveTab('theaters')}
          className={`py-3 px-6 font-medium ${activeTab === 'theaters' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          {user?.role === 'super_admin' ? 'Theater Approvals' : 'My Theaters'}
        </button>
      </div>

      {activeTab === 'movies' && (
        <div className="grid md:grid-cols-2 gap-12">
          {/* Sync from OMDB */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-red-400"/> Sync Movie from OMDB</h2>
            <form onSubmit={searchOMDB} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Search movie title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition">
                <Search size={18} /> Search
              </button>
            </form>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {omdbResults.map((m, i) => (
                <div key={i} className="flex gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800 items-center">
                  <img src={m.Poster} alt={m.Title} className="w-12 h-16 object-cover rounded" />
                  <div className="flex-grow">
                    <h3 className="font-bold">{m.Title}</h3>
                    <p className="text-sm text-gray-500">{m.Year}</p>
                  </div>
                  <button onClick={() => syncMovie(m.imdbID)} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 border border-gray-600 rounded">
                    Sync
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Local db movies */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Film size={20} className="text-red-400"/> Platform Movies</h2>
            {localMovies.length === 0 ? <p className="text-gray-500">No movies synced yet.</p> : (
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {localMovies.map((m, i) => (
                 <div key={i} className="flex gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800 items-center">
                   <img src={m.posterUrl} alt={m.title} className="w-12 h-16 object-cover rounded" />
                   <div className="flex-grow">
                     <h3 className="font-bold">{m.title}</h3>
                     <p className="text-sm text-gray-500">{m.genre}</p>
                   </div>
                   {user?.role === 'theater_admin' && (
                     <button
                       onClick={() => openShowtimeModal(m)}
                       className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded transition border border-blue-500/20 hover:border-blue-400/40"
                     >
                       <Calendar size={14} /> Add Showtime
                     </button>
                   )}
                   {user?.role === 'super_admin' && (
                     <button onClick={() => deleteMovie(m._id, m.title)} className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded transition">
                       Delete
                     </button>
                   )}
                 </div>
               ))}
             </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'theaters' && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold">{user?.role === 'super_admin' ? 'Review Theaters' : 'Your Theaters'}</h2>
             {user?.role === 'theater_admin' && (
               <button 
                 onClick={() => setShowTheaterForm(!showTheaterForm)}
                 className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
               >
                 <PlusCircle size={16} /> {showTheaterForm ? 'Cancel' : 'Register New Theater'}
               </button>
             )}
           </div>

           {showTheaterForm && user?.role === 'theater_admin' && (
             <form onSubmit={submitTheater} className="mb-8 bg-gray-900 p-6 rounded-lg border border-gray-700 space-y-4">
               <h3 className="font-bold text-lg mb-4 text-red-400">Theater Application</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">Theater Name</label>
                   <input required type="text" value={newTheater.name} onChange={e => setNewTheater({...newTheater, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                 </div>
                 <div>
                   <label className="block text-sm text-gray-400 mb-1">City</label>
                   <input required type="text" value={newTheater.city} onChange={e => setNewTheater({...newTheater, city: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm text-gray-400 mb-1">Specific Location / Address</label>
                   <input required type="text" value={newTheater.location} onChange={e => setNewTheater({...newTheater, location: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
                 </div>
               </div>
               <button type="submit" className="bg-white text-black font-bold px-6 py-2 rounded mt-4 hover:bg-gray-200">Submit Application</button>
             </form>
           )}

           {theaters.length === 0 ? <p className="text-gray-500">No theaters found.</p> : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-400">
                 <thead className="bg-gray-900 text-gray-300">
                   <tr>
                     <th className="px-4 py-3 rounded-tl-lg">Name</th>
                     <th className="px-4 py-3">Location</th>
                     <th className="px-4 py-3">Status</th>
                     <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {theaters.map((t, i) => (
                     <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30">
                       <td className="px-4 py-4 font-medium text-white">{t.name}</td>
                       <td className="px-4 py-4">{t.city}, {t.location}</td>
                       <td className="px-4 py-4">
                         <span className={`px-2 py-1 rounded text-xs
                            ${t.status === 'approved' ? 'bg-green-500/20 text-green-400' : 
                              t.status === 'blocked' ? 'bg-orange-500/20 text-orange-400' : 
                              t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}
                          `}>
                           {t.status.toUpperCase()}
                         </span>
                       </td>
                      <td className="px-4 py-4 flex gap-2 items-center">
                          {user?.role === 'super_admin' && (
                            <button onClick={() => setSelectedTheater(t)} className="text-blue-400 hover:text-blue-300 underline font-medium">View & Manage</button>
                          )}
                          {user?.role === 'theater_admin' && t.status === 'approved' && (
                            <button
                              onClick={() => { setActiveTab('movies'); }}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                            >
                              <Calendar size={12} /> Add Showtime
                            </button>
                          )}
                          {user?.role === 'theater_admin' && t.status === 'pending' && (
                            <span className="text-xs text-yellow-400">Awaiting approval</span>
                          )}
                          {user?.role === 'theater_admin' && t.status === 'rejected' && (
                            <span className="text-xs text-red-400">Application rejected</span>
                          )}
                          {user?.role === 'theater_admin' && t.status === 'blocked' && (
                            <span className="text-xs text-orange-400">Theater is blocked by admin</span>
                          )}
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}

           {selectedTheater && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
                 <div className="bg-gray-800 rounded-[2.5rem] max-w-5xl w-full border border-gray-700 shadow-2xl relative">
                    <button onClick={() => setSelectedTheater(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition">
                       <X size={24} />
                    </button>
                    
                    <div className="p-10">
                       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                          <div>
                             <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${selectedTheater.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {selectedTheater.status} theater
                             </span>
                             <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedTheater.name}</h2>
                             <p className="text-gray-500 font-bold text-sm flex items-center gap-2 mt-1">
                                <MapPin size={14} /> {selectedTheater.location}, {selectedTheater.city}
                             </p>
                          </div>
                          
                          <div className="flex gap-3">
                             {selectedTheater.status === 'pending' && (
                                <>
                                   <button onClick={() => { updateTheaterStatus(selectedTheater._id, 'approved'); setSelectedTheater(null); }} className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-xl font-bold text-white transition">Approve</button>
                                   <button onClick={() => { updateTheaterStatus(selectedTheater._id, 'rejected'); setSelectedTheater(null); }} className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-xl font-bold text-white transition">Reject</button>
                                </>
                             )}
                             {selectedTheater.status === 'approved' && (
                                <button onClick={() => { updateTheaterStatus(selectedTheater._id, 'blocked'); setSelectedTheater(null); }} className="bg-orange-600/10 text-orange-500 border border-orange-500/20 hover:bg-orange-600 hover:text-white px-6 py-2.5 rounded-xl font-bold transition">Block Theater</button>
                             )}
                             {selectedTheater.status === 'blocked' && (
                                <button onClick={() => { updateTheaterStatus(selectedTheater._id, 'approved'); setSelectedTheater(null); }} className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-xl font-bold text-white transition">Unblock</button>
                             )}
                          </div>
                       </div>

                       {selectedTheater.status === 'approved' && theaterStats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                             <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Net Revenue</p>
                                <p className="text-2xl font-black text-white">₹{theaterStats.netProfit}</p>
                             </div>
                             <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Sales</p>
                                <p className="text-2xl font-black text-white">{theaterStats.totalBookings}</p>
                             </div>
                             <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Success Rate</p>
                                <p className="text-2xl font-black text-emerald-500">{theaterStats.totalBookings > 0 ? Math.round((theaterStats.completedBookings / theaterStats.totalBookings) * 100) : 0}%</p>
                             </div>
                             <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pending</p>
                                <p className="text-2xl font-black text-amber-500">{theaterStats.pendingBookings}</p>
                             </div>
                          </div>
                       )}

                       {selectedTheater.status === 'approved' && (
                          <div className="bg-gray-900/50 rounded-3xl border border-gray-700/50 overflow-hidden">
                             <div className="px-8 py-4 border-b border-gray-800 bg-gray-900/30">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Recent Theater Activity</h4>
                             </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                   <thead className="bg-gray-900/50 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                      <tr>
                                         <th className="px-8 py-3">Movie</th>
                                         <th className="px-8 py-3">Seats</th>
                                         <th className="px-8 py-3">Amount</th>
                                         <th className="px-8 py-3">Status</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-800">
                                      {theaterBookings.length === 0 ? (
                                         <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-600 font-bold text-xs uppercase tracking-widest italic">No bookings found for this theater</td></tr>
                                      ) : theaterBookings.map(b => (
                                         <tr key={b._id} className="text-xs">
                                            <td className="px-8 py-4 font-bold text-gray-300">{b.showTimeId.movieId.title}</td>
                                            <td className="px-8 py-4 text-gray-500 font-black tracking-tighter">{b.seatNumbers.join(', ')}</td>
                                            <td className="px-8 py-4 font-black text-white">₹{b.totalAmount}</td>
                                            <td className="px-8 py-4">
                                               <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${b.paymentStatus === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>{b.paymentStatus}</span>
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       )}

                       <div className="mt-10 grid grid-cols-2 gap-8 border-t border-gray-800 pt-8">
                          <div>
                             <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-1">Admin Info</p>
                             <p className="text-white font-bold text-sm">{selectedTheater.adminId?.name || 'N/A'}</p>
                             <p className="text-gray-500 text-xs font-bold">{selectedTheater.adminId?.email || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                             <button onClick={() => setSelectedTheater(null)} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-black text-[10px] uppercase tracking-widest transition">Close Inspector</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}
      {/* Add Showtime Modal */}
      {showtimeMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl max-w-5xl w-full border border-gray-700 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Context & Basics */}
            <div className="w-full md:w-2/5 bg-gray-900/50 p-8 border-r border-gray-700/50 flex flex-col">
              <div className="flex flex-col items-center text-center mb-8">
                <img src={showtimeMovie.posterUrl} alt={showtimeMovie.title} className="w-32 h-48 object-cover rounded-2xl border-4 border-gray-800 shadow-2xl mb-4" />
                <h2 className="text-2xl font-black text-white leading-tight">{showtimeMovie.title}</h2>
                <p className="text-red-500 font-bold text-sm tracking-widest uppercase mt-2">{showtimeMovie.genre}</p>
              </div>

              <div className="space-y-6 flex-grow">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Select Theater</label>
                  {myTheaters.length === 0 ? (
                    <p className="text-yellow-500 text-xs bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10">No approved theaters available.</p>
                  ) : (
                    <select
                      value={showtimeForm.theaterId}
                      onChange={e => setShowtimeForm({...showtimeForm, theaterId: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition font-bold"
                    >
                      {myTheaters.map((t: any) => (
                        <option key={t._id} value={t._id}>{t.name} — {t.city}</option>
                      ) )}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Screen</label>
                    <select
                      value={showtimeForm.screen}
                      onChange={e => setShowtimeForm({...showtimeForm, screen: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition font-bold"
                    >
                      {['Screen 1', 'Screen 2', 'Screen 3', 'IMAX'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Seats/Row</label>
                    <input 
                      type="number" 
                      value={showtimeForm.seatsPerRow}
                      onChange={e => setShowtimeForm({...showtimeForm, seatsPerRow: Number(e.target.value)})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Show Time</label>
                  <input
                    type="datetime-local"
                    value={showtimeForm.startTime}
                    onChange={e => setShowtimeForm({...showtimeForm, startTime: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Layout & Action */}
            <div className="w-full md:w-3/5 p-8 flex flex-col bg-gray-800 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Pricing Zones</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowtimeForm({
                    ...showtimeForm, 
                    zones: [...showtimeForm.zones, { category: 'Silver', rows: 'F,G', price: 150 }]
                  })}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 transition"
                >
                  + Add New Category
                </button>
              </div>

              <div className="flex-grow space-y-4 overflow-y-auto pr-2 no-scrollbar mb-8" style={{ maxHeight: '400px' }}>
                {showtimeForm.zones.map((zone, idx) => (
                  <div key={idx} className="bg-gray-900 p-6 rounded-2xl border border-gray-700/50 hover:border-red-500/30 transition-colors relative group">
                    <button 
                      type="button"
                      onClick={() => setShowtimeForm({
                        ...showtimeForm,
                        zones: showtimeForm.zones.filter((_, i) => i !== idx)
                      })}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-black opacity-0 group-hover:opacity-100 transition shadow-xl z-10"
                    >
                      ×
                    </button>
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 sm:col-span-6">
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1 block">Category Name</label>
                        <input 
                          type="text" 
                          value={zone.category}
                          onChange={e => {
                            const newZones = [...showtimeForm.zones];
                            newZones[idx].category = e.target.value;
                            setShowtimeForm({...showtimeForm, zones: newZones});
                          }}
                          className="w-full bg-transparent border-b-2 border-gray-800 focus:border-red-600 py-1 text-white font-bold outline-none uppercase tracking-wide"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-6">
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1 block">Price (₹)</label>
                        <input 
                          type="number" 
                          value={zone.price}
                          onChange={e => {
                            const newZones = [...showtimeForm.zones];
                            newZones[idx].price = Number(e.target.value);
                            setShowtimeForm({...showtimeForm, zones: newZones});
                          }}
                          className="w-full bg-transparent border-b-2 border-gray-800 focus:border-red-600 py-1 text-red-500 font-black text-lg outline-none"
                        />
                      </div>
                      <div className="col-span-12">
                         <label className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1 block">Assign Rows (e.g. A, B, C)</label>
                         <input 
                           type="text" 
                           value={zone.rows}
                           placeholder="A,B,C"
                           onChange={e => {
                             const newZones = [...showtimeForm.zones];
                             newZones[idx].rows = e.target.value;
                             setShowtimeForm({...showtimeForm, zones: newZones});
                           }}
                           className="w-full bg-transparent border-b-2 border-gray-800 focus:border-red-600 py-1 text-gray-300 font-bold outline-none"
                         />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex gap-3">
                <button
                  type="button"
                  onClick={submitShowtime}
                  disabled={showtimeLoading || myTheaters.length === 0}
                  className="flex-grow bg-red-600 hover:bg-red-500 disabled:opacity-50 py-2.5 rounded-xl font-bold text-white uppercase tracking-wider transition-all duration-300 shadow-xl shadow-red-600/10 flex items-center justify-center gap-2 text-sm"
                >
                  {showtimeLoading ? 'Finalizing...' : <>Complete Schedule <CheckCircle size={18} /></>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowtimeMovie(null)}
                  className="px-6 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 font-bold transition flex items-center gap-2 text-sm"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
