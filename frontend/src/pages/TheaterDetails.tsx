import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, TrendingUp, Ticket, CheckCircle, Clock, 
  ChevronLeft, ArrowRight, User, Calendar
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

export default function TheaterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theater, setTheater] = useState<any | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      try {
        // Fetch theater basic info
        const theaterRes = await axios.get(`/api/theaters/all`, { headers });
        const currentTheater = theaterRes.data.find((t: any) => t._id === id);
        setTheater(currentTheater);

        // Fetch stats and bookings
        const [statsRes, bookingsRes] = await Promise.all([
          axios.get(`/api/bookings/admin/stats?theaterId=${id}`, { headers }),
          axios.get(`/api/bookings/admin/all?theaterId=${id}&limit=100`, { headers })
        ]);
        
        setStats(statsRes.data);
        setBookings(bookingsRes.data.bookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center mt-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;

  if (!theater) return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-center">
      <h2 className="text-2xl font-black text-white uppercase mb-4">Theater Not Found</h2>
      <button onClick={() => navigate(-1)} className="text-red-500 font-bold flex items-center gap-2 mx-auto">
        <ChevronLeft size={20} /> Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header Navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="group flex items-center gap-3 text-gray-500 hover:text-white transition-all mb-8 bg-gray-900/50 px-5 py-2.5 rounded-2xl border border-gray-800"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition" />
        <span className="text-xs font-black uppercase tracking-widest">Return to Analytics</span>
      </button>

      {/* Hero Section */}
      <div className="relative mb-12 bg-gray-900 border border-gray-800 rounded-[3rem] p-12 overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[120px]"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <span className="bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-green-600/20">Verified Branch</span>
               <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
               <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">ID: {theater._id.slice(-6)}</span>
            </div>
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">{theater.name}</h1>
            <div className="flex flex-wrap items-center gap-8 text-gray-400 font-bold">
               <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-xl">
                  <MapPin size={18} className="text-red-500" />
                  <span className="text-sm">{theater.location}, {theater.city}</span>
               </div>
               <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-xl">
                  <User size={18} className="text-blue-500" />
                  <span className="text-sm">{theater.adminId?.name || 'Owner N/A'}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
         <BigStatCard title="Theater Revenue" value={`₹${stats?.netProfit.toLocaleString()}`} icon={<TrendingUp />} color="text-green-500" />
         <BigStatCard title="Tickets Issued" value={stats?.totalBookings || 0} icon={<Ticket />} color="text-blue-500" />
         <BigStatCard title="Successful Sales" value={stats?.completedBookings || 0} icon={<CheckCircle />} color="text-emerald-500" />
         <BigStatCard title="In Progress" value={stats?.pendingBookings || 0} icon={<Clock />} color="text-amber-500" />
      </div>

      {/* Detailed Bookings Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
         <div className="p-10 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
            <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Transaction Ledger</h3>
               <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Complete history for {theater.name}</p>
            </div>
            <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500">
               <ArrowRight size={24} />
            </div>
         </div>

         <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-800">
                     <th className="px-10 py-5 bg-gray-900/80 backdrop-blur-md">Booking ID</th>
                     <th className="px-10 py-5 bg-gray-900/80 backdrop-blur-md">Customer Details</th>
                     <th className="px-10 py-5 bg-gray-900/80 backdrop-blur-md">Movie & Zone</th>
                     <th className="px-10 py-5 bg-gray-900/80 backdrop-blur-md">Seats</th>
                     <th className="px-10 py-5 bg-gray-900/80 backdrop-blur-md">Status</th>
                     <th className="px-10 py-5 bg-gray-900/80 backdrop-blur-md text-right">Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-800/50">
                  {bookings.map((booking) => (
                     <tr key={booking._id} className="hover:bg-gray-800/20 transition group">
                        <td className="px-10 py-6">
                           <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-red-500 transition">#{booking._id.slice(-8)}</span>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-white font-bold text-sm mb-0.5">{booking.userId?.name || 'Guest User'}</p>
                           <p className="text-gray-500 text-[10px] font-medium">{booking.userId?.email || 'N/A'}</p>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-white font-black text-[11px] uppercase mb-1">{booking.showTimeId.movieId.title}</p>
                           <div className="flex items-center gap-2 text-gray-600 text-[10px] font-bold">
                              <Calendar size={10} /> {new Date(booking.showTimeId.startTime).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex flex-wrap gap-1.5">
                              {booking.seatNumbers.map(s => (
                                 <span key={s} className="bg-gray-800 text-[9px] font-black text-gray-400 px-2 py-1 rounded border border-gray-700 uppercase">{s}</span>
                              ))}
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${booking.paymentStatus === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                              {booking.paymentStatus}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <p className="text-white font-black text-lg">₹{booking.totalAmount}</p>
                           <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Paid via Card</p>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {bookings.length === 0 && (
               <div className="p-20 text-center">
                  <Ticket size={40} className="text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-600 font-black uppercase text-xs tracking-widest">No activity recorded for this theater</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}

function BigStatCard({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:border-gray-700 transition duration-500">
       <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} blur-[50px] opacity-10 group-hover:opacity-20 transition duration-500`}></div>
       <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</p>
          <div className={`w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center ${color}`}>
             {icon}
          </div>
       </div>
       <h4 className="text-4xl font-black text-white mb-1">{value}</h4>
       <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-600 uppercase tracking-widest mt-2">
          <TrendingUp size={10} /> Live Data Feed
       </div>
    </div>
  );
}
