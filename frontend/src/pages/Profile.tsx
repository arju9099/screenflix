import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, MapPin, Ticket, User as UserIcon, Clock as ClockIcon, ChevronRight, 
  TrendingUp, CheckCircle, Search
} from 'lucide-react';

interface Booking {
  _id: string;
  showTimeId: {
    movieId: { title: string; posterUrl: string };
    theaterId: { name: string; location: string };
    screen: string;
    startTime: string;
  };
  userId?: { name: string; email: string };
  seatNumbers: string[];
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface Stats {
  totalBookings: number;
  completedBookings: number;
  netProfit: number;
  pendingBookings: number;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [theaterSearch, setTheaterSearch] = useState('');

  const isAdmin = user?.role === 'theater_admin' || user?.role === 'super_admin';

  useEffect(() => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    if (isAdmin) {
      const theaterUrl = user?.role === 'super_admin' ? '/api/theaters/all' : '/api/theaters/mine';
      Promise.all([
        axios.get(`/api/bookings/admin/stats`, { headers }),
        axios.get(theaterUrl, { headers })
      ]).then(([statsRes, theatersRes]) => {
        setStats(statsRes.data);
        setTheaters(theatersRes.data);
      }).catch(err => console.error(err))
      .finally(() => setLoading(false));
    } else {
      axios.get('/api/bookings/mybookings', { headers })
      .then(res => setBookings(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
    }
  }, [isAdmin, user?.role]);

  if (loading) return <div className="flex justify-center mt-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;

  if (isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Platform Analytics</h1>
              <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.2em]">Global Oversight Dashboard</p>
           </div>
           <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 p-2 rounded-2xl">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                 <UserIcon size={20} />
              </div>
              <div className="pr-4">
                 <p className="text-white font-black text-sm leading-tight">{user?.name}</p>
                 <p className="text-gray-600 font-bold text-[10px] uppercase tracking-widest">{user?.role.replace('_', ' ')}</p>
              </div>
           </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           <StatCard title="Global Revenue" value={`₹${stats?.netProfit.toLocaleString()}`} icon={<TrendingUp className="text-green-500" />} color="bg-green-500/10" />
           <StatCard title="Total Tickets" value={stats?.totalBookings || 0} icon={<Ticket size={20} className="text-blue-500" />} color="bg-blue-500/10" />
           <StatCard title="Paid Bookings" value={stats?.completedBookings || 0} icon={<CheckCircle className="text-emerald-500" />} color="bg-emerald-500/10" />
           <StatCard title="In-Progress" value={stats?.pendingBookings || 0} icon={<ClockIcon className="text-amber-500" />} color="bg-amber-500/10" />
        </div>

        {/* Managed Theaters Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
           <div className="p-8 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Verified Theater Network</h3>
              </div>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search theater network..." 
                   className="bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 w-full md:w-80"
                   value={theaterSearch}
                   onChange={(e) => setTheaterSearch(e.target.value)}
                 />
              </div>
           </div>

           <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                 <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="bg-gray-900/50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-800">
                       <th className="px-8 py-5">Theater Name</th>
                       <th className="px-8 py-5">Location</th>
                       <th className="px-8 py-5">Owner / Admin</th>
                       <th className="px-8 py-5">Status</th>
                       <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800">
                    {theaters.filter(t => 
                       t.status === 'approved' && 
                       t.name.toLowerCase().includes(theaterSearch.toLowerCase())
                    ).map((t) => (
                       <tr key={t._id} className="hover:bg-gray-800/30 transition group">
                          <td className="px-8 py-6">
                             <p className="text-white font-black text-sm uppercase">{t.name}</p>
                          </td>
                          <td className="px-8 py-6">
                             <p className="text-gray-400 font-bold text-xs flex items-center gap-2">
                                <MapPin size={12} className="text-red-500" /> {t.city}, {t.location}
                             </p>
                          </td>
                          <td className="px-8 py-6">
                             <p className="text-gray-300 font-medium text-xs">{t.adminId?.name || 'N/A'}</p>
                             <p className="text-gray-600 text-[10px]">{t.adminId?.email}</p>
                          </td>
                          <td className="px-8 py-6">
                             <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle size={12} /> Verified
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => navigate(`/admin/theater/${t._id}`)}
                               className="bg-gray-800 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                             >
                                Full Report <ChevronRight size={14} className="inline ml-1" />
                             </button>
                          </td>
                       </tr>
                    ))}
                    {theaters.length === 0 && (
                       <tr>
                          <td colSpan={5} className="p-20 text-center">
                             <p className="text-gray-600 font-black uppercase text-xs tracking-widest">No verified theaters found</p>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  }

  // --- REGULAR USER VIEW ---
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-12">
        {/* User Sidebar */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 sticky top-24 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[80px] group-hover:bg-red-600/10 transition-all duration-1000"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-6 border-4 border-gray-800 shadow-xl">
                 <UserIcon size={40} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{user?.name}</h2>
              <p className="text-gray-500 text-sm font-bold tracking-wide mb-6">{user?.email}</p>
              <div className="w-full h-px bg-gray-800 mb-6"></div>
              <div>
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Total Bookings</p>
                 <p className="text-2xl font-black text-red-500">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Booking History */}
        <div className="flex-grow">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-12 flex items-center gap-4">
             <span className="w-2 h-8 bg-red-600 rounded-full"></span> My Tickets
          </h2>
          <div className="space-y-8">
            {bookings.length > 0 ? bookings.map((booking) => (
              <div key={booking._id} className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl hover:border-gray-700 transition duration-300 group">
                <div className="w-full md:w-40 h-56 md:h-auto overflow-hidden">
                   <img src={booking.showTimeId.movieId.posterUrl} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" alt="" />
                </div>
                <div className="flex-grow p-6 flex flex-col justify-between">
                   <div>
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{booking.showTimeId.movieId.title}</h3>
                            <div className="flex items-center gap-2 text-red-500 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                               <MapPin size={10} /> {booking.showTimeId.theaterId.name} • {booking.showTimeId.screen}
                            </div>
                         </div>
                         <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${booking.paymentStatus === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                            {booking.paymentStatus}
                         </div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-800">
                         <div className="flex items-center gap-2.5">
                            <Calendar size={12} className="text-gray-400" />
                            <div>
                               <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest">Date</p>
                               <p className="text-[11px] font-bold text-gray-300">{new Date(booking.showTimeId.startTime).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2.5">
                            <ClockIcon size={12} className="text-gray-400" />
                            <div>
                               <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest">Time</p>
                               <p className="text-[11px] font-bold text-gray-300">{new Date(booking.showTimeId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2.5">
                            <Ticket size={12} className="text-gray-400" />
                            <div>
                               <p className="text-[7.5px] font-black text-gray-600 uppercase tracking-widest">Seats</p>
                               <p className="text-[11px] font-bold text-white tracking-widest">{booking.seatNumbers.join(', ')}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                      <div>
                         <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Paid</p>
                         <p className="text-xl font-black text-white">₹{booking.totalAmount}</p>
                      </div>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-[9px] uppercase tracking-widest transition group">
                         Digital Receipt <ChevronRight size={12} className="group-hover:translate-x-1 transition" />
                      </button>
                   </div>
                </div>
              </div>
            )) : (
              <div className="bg-gray-900 border-2 border-dashed border-gray-800 rounded-[3rem] p-32 text-center">
                 <Ticket size={40} className="text-gray-700 mx-auto mb-4" />
                 <h3 className="text-xl font-black text-gray-500 uppercase tracking-tighter mb-2">No active bookings</h3>
                 <p className="text-gray-600 text-sm max-w-xs mx-auto font-bold text-center">Looks like you haven't booked any movies yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT ---
function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
       <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} blur-[50px] opacity-20 group-hover:opacity-40 transition`}></div>
       <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</p>
          <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
             {icon}
          </div>
       </div>
       <h4 className="text-3xl font-black text-white">{value}</h4>
    </div>
  );
}
