import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Info, ChevronLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Initialize Stripe with Environment Variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface Seat {
  seatNumber: string;
  status: 'available' | 'booked';
  category: string;
  price: number;
}

interface ShowTimeDetail {
  _id: string;
  movieId: { title: string; posterUrl: string };
  theaterId: { name: string; location: string };
  screen: string;
  startTime: string;
  seats: Seat[];
}

export default function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showtime, setShowtime] = useState<ShowTimeDetail | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1); // 1: Select Seats, 2: Checkout Summary
  const [clientSecret, setClientSecret] = useState("");
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    axios.get(`/api/showtimes/${id}`)
      .then(res => setShowtime(res.data))
      .catch(() => {
        // Fallback or handle error
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked') return;
    
    if (selectedSeats.find(s => s.seatNumber === seat.seatNumber)) {
      setSelectedSeats(prev => prev.filter(s => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 8) {
        alert("You can only select up to 8 seats at once.");
        return;
      }
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

  const initBooking = async () => {
    if (!user) {
      alert("Please login to book tickets.");
      navigate('/login');
      return;
    }
    
    if (selectedSeats.length === 0) return;

    setBooking(true);
    try {
      const res = await axios.post('/api/bookings', {
        showTimeId: id,
        seatNumbers: selectedSeats.map(s => s.seatNumber)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setClientSecret(res.data.clientSecret);
      setBookingId(res.data.bookingId);
      setBookingStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to initiate booking.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>;
  if (!showtime) return <div className="text-center mt-20 text-xl text-gray-500 font-bold">Showtime not found</div>;

  // Group by Category, then by Row
  const categoryGroups: Record<string, Record<string, Seat[]>> = {};
  showtime.seats.forEach(seat => {
    const cat = seat.category || 'General';
    const row = seat.seatNumber.charAt(0);
    if (!categoryGroups[cat]) categoryGroups[cat] = {};
    if (!categoryGroups[cat][row]) categoryGroups[cat][row] = [];
    categoryGroups[cat][row].push(seat);
  });

  const totalAmount = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);

  const getSeatColor = (category: string, isSelected: boolean, status: string) => {
    if (status === 'booked') return 'bg-gray-800 text-gray-600 cursor-not-allowed border-gray-900';
    if (isSelected) return 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-600/40 translate-y-[-2px]';
    
    // Category colors
    switch(category.toLowerCase()) {
      case 'platinum': return 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500 hover:text-white';
      case 'gold': return 'bg-amber-600/20 border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-white';
      case 'silver': return 'bg-slate-600/20 border-slate-500/50 text-slate-400 hover:bg-slate-500 hover:text-white';
      default: return 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:bg-gray-600 hover:text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in min-h-screen flex flex-col">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => bookingStep === 2 ? setBookingStep(1) : navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white transition group">
          <ChevronLeft className="group-hover:-translate-x-1 transition" size={20} />
          {bookingStep === 1 ? 'Back to Movie' : 'Change Seats'}
        </button>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-1 rounded-full transition-all duration-500 ${bookingStep >= 1 ? 'bg-red-600' : 'bg-gray-800'}`}></div>
            <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Seats</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-1 rounded-full transition-all duration-500 ${bookingStep >= 2 ? 'bg-red-600' : 'bg-gray-800'}`}></div>
            <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Checkout</span>
          </div>
        </div>
      </div>

      {bookingStep === 1 ? (
        /* STEP 1: SEAT MAP */
        <div className="flex-grow flex flex-col items-center">
          {/* Top Selection Summary Bar */}
          <div className={`w-full max-w-4xl mb-10 transition-all duration-500 transform ${selectedSeats.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
             <div className="bg-gray-900 border border-red-500/20 p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-8 pl-6">
                   <div>
                      <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest leading-none mb-1">Seats</p>
                      <p className="text-xl font-black text-white leading-none">{selectedSeats.length} Selected</p>
                   </div>
                   <div className="w-px h-10 bg-gray-800"></div>
                   <div>
                      <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest leading-none mb-1">Total Pay</p>
                      <p className="text-xl font-black text-red-500 leading-none font-mono">₹{totalAmount}</p>
                   </div>
                </div>
                <button 
                  onClick={initBooking}
                  disabled={booking}
                  className="bg-red-600 hover:bg-red-500 text-white px-12 py-4 rounded-3xl font-black uppercase text-xs tracking-widest transition shadow-2xl shadow-red-600/30 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {booking ? 'Initiating...' : <>Proceed to Checkout <CheckCircle size={18} /></>}
                </button>
             </div>
          </div>

          <div className="text-center mb-16 relative">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Pick Your Spot</h2>
            <div className="flex items-center justify-center gap-3 text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
              <span className="text-red-500">{showtime.theaterId.name}</span>
              <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              <span>{new Date(showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/20 to-transparent"></div>
            
            {/* Screen Visualization */}
            <div className="mb-24 flex flex-col items-center">
              <div className="w-full h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-[100%] shadow-[0_25px_50px_-5px_rgba(220,38,38,0.4)] opacity-70" />
              <p className="mt-8 text-[9px] text-gray-600 font-black tracking-[1.5em] uppercase opacity-50">Silver Screen Cinema</p>
            </div>

            {/* Render Categories */}
            <div className="space-y-10 pb-8">
              {Object.entries(categoryGroups)
                .sort((a, b) => {
                  const priceA = Object.values(a[1])[0][0].price;
                  const priceB = Object.values(b[1])[0][0].price;
                  return priceA - priceB; // Low price at top (near screen), High price at bottom
                })
                .map(([catName, rows]) => (
                <div key={catName} className="relative">
                  <div className="space-y-2">
                    {Object.entries(rows).sort().map(([rowName, seats]) => (
                      <div key={rowName} className="flex items-center justify-center gap-4">
                        <span className="w-6 text-[9px] font-black text-gray-700 text-center">{rowName}</span>
                        <div className="flex flex-nowrap items-center justify-center gap-2">
                          {seats.map(seat => {
                             const isSelected = !!selectedSeats.find(s => s.seatNumber === seat.seatNumber);
                             return (
                               <button
                                 key={seat.seatNumber}
                                 disabled={seat.status === 'booked'}
                                 onClick={() => handleSeatClick(seat)}
                                 className={`
                                   w-7 h-7 rounded-lg border flex items-center justify-center text-[8px] font-black transition-all duration-300
                                   ${getSeatColor(catName, isSelected, seat.status)}
                                 `}
                               >
                                 {seat.seatNumber.slice(1)}
                               </button>
                             );
                          })}
                        </div>
                        <span className="w-6 text-[9px] font-black text-gray-700 text-center">{rowName}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-center">
                     <span className="bg-gray-800/30 px-3 py-1 rounded-full border border-gray-700/50 text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">
                       {catName} • ₹{Object.values(rows)[0][0].price}
                     </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-6 opacity-60">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-lg bg-gray-800 border border-gray-700"></div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Booked</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-lg bg-red-600"></div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Selected</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-lg bg-indigo-600/40 border border-indigo-500/50"></div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Platinum</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-lg bg-amber-600/40 border border-amber-500/50"></div>
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Gold</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: CHECKOUT SUMMARY & PAYMENT */
        <div className="flex-grow flex flex-col items-center animate-fade-in w-full">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16">
             
             {/* LEFT SIDE: PAYMENT GATEWAYS */}
             <div className="space-y-10 order-2 lg:order-1">
                <div className="border-b border-gray-800 pb-6 mb-8">
                   <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-4">
                      <span className="text-red-600">01</span> Payment Options
                   </h2>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl">
                   {clientSecret && stripePromise ? (
                     <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm 
                          bookingId={bookingId} 
                          onSuccess={() => {
                            alert("Payment Successful!");
                            navigate('/profile'); 
                          }} 
                        />
                     </Elements>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest text-center">
                          {!clientSecret ? 'Preparing Secure Gateway...' : 'Loading Stripe...'}
                        </p>
                        {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && (
                          <p className="text-[10px] text-red-500 font-bold max-w-xs text-center mt-4">
                            Warning: Stripe Publishable Key is missing. Please check your .env file and restart the dev server.
                          </p>
                        )}
                     </div>
                   )}
                </div>

                {/* Other payment logos placeholder */}
                <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition duration-500">
                    <div className="h-8 w-12 bg-white rounded-md"></div>
                    <div className="h-8 w-12 bg-white rounded-md"></div>
                    <div className="h-8 w-12 bg-white rounded-md"></div>
                </div>
             </div>

             {/* RIGHT SIDE: ORDER SUMMARY */}
             <div className="order-1 lg:order-2 space-y-8">
                <div className="border-b border-gray-800 pb-6 mb-8">
                   <h2 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-4">
                      <span className="text-red-600">02</span> Booking Summary
                   </h2>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[120px] transition-all duration-1000 group-hover:bg-red-600/10"></div>
                   
                   <div className="flex gap-8 mb-10">
                      <img src={showtime.movieId.posterUrl} className="w-32 h-44 object-cover rounded-2xl shadow-xl" alt="" />
                      <div>
                         <h3 className="text-2xl font-black text-white mb-2 leading-tight uppercase">{showtime.movieId.title}</h3>
                         <p className="text-red-500 font-bold text-sm tracking-wide mb-4">{showtime.theaterId.name}</p>
                         <div className="flex flex-wrap gap-2">
                            <span className="bg-gray-800 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-gray-400 border border-gray-700">{showtime.screen}</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800">
                         <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Date</label>
                         <p className="text-white font-bold text-sm">{new Date(showtime.startTime).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800">
                         <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Showtime</label>
                         <p className="text-white font-bold text-sm">{new Date(showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                   </div>

                   <div className="mb-10">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-3">Selected Tickets ({selectedSeats.length})</label>
                      <div className="flex flex-wrap gap-2">
                         {selectedSeats.map(s => (
                           <div key={s.seatNumber} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                              <span className="text-white font-black text-xs">{s.seatNumber}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-8 border-t border-gray-800 flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Grand Total</p>
                         <p className="text-4xl font-black text-red-500">₹{totalAmount}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Secure Payment</span>
                         <CheckCircle className="text-green-500/50 mt-1" size={16} />
                      </div>
                   </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex gap-4">
                   <Info className="text-amber-500 shrink-0" size={20} />
                   <div className="space-y-1">
                      <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Notice</p>
                      <p className="text-gray-500 text-xs leading-relaxed">By proceeding, you agree to our terms of service. Tickets are non-refundable once the transaction is complete.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
