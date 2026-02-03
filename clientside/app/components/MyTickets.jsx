import React, { useEffect, useState } from 'react';
import { Ticket, RefreshCcw, MapPin} from 'lucide-react';
import { subscribeToUserTickets, getUserAvatarUrl, getUserProfile } from '../../lib/supabase/database';
import { QRCodeCanvas } from "qrcode.react";


export function MyTickets({ myTickets, resellTicket, setView, userId, userName, avatarUrl }) {
  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToUserTickets(userId, (payload) => {
      if (payload.eventType === 'INSERT') {
      } else if (payload.eventType === 'UPDATE') {
        // Handled by parent component
      } else if (payload.eventType === 'DELETE') {
        // Handled by parent component
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [userId]);

  const [qrSize, setQrSize] = useState(220);
  const [username, setUsername] = useState(userName || null); // Initialize from prop

  

  useEffect(() => {
    const updateSize = () => {
      if (typeof window === 'undefined') return;
      setQrSize(window.innerWidth < 640 ? 160 : 220);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Map of owner_id -> avatar url (tries to retrieve from storage)
  const [avatarMap, setAvatarMap] = useState({});

  useEffect(() => {
    if (!myTickets || !myTickets.length) return;
    const owners = Array.from(new Set(myTickets.map(t => t.owner_id).filter(Boolean)));
    const toFetch = owners.filter(id => !avatarMap[id]);
    if (!toFetch.length) return;

    const next = {};
    toFetch.forEach(id => {
      try {
        const url = getUserAvatarUrl(id);
        next[id] = url || null;
      } catch (err) {
        next[id] = null;
      }
    });
    setAvatarMap(prev => ({ ...prev, ...next }));
  }, [myTickets]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setUsername(null);
        return;
      }
      try {
        const profile = await getUserProfile(userId); // Same function from VenueScanner
        setUsername(profile?.full_name || userName || null);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setUsername(userName || null);
      }
    };

    fetchUserProfile();
  }, [userId, userName]); // Dependencies: re-fetch if userId or prop changes


  return (
    <div className="px-4 py-6 sm:px-6 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Secure Tickets</h2>
      {myTickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Ticket size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">You havent purchased any tickets yet.</p>
          <button onClick={() => setView('marketplace')} className="mt-4 text-emerald-600 font-medium hover:underline">Browse Events</button>
        </div>
      ) : (
        <div className="space-y-6">
          {myTickets.map(ticket => {
            const ownerAvatar = avatarMap[ticket.owner_id] || avatarUrl || `/avatars/${userId}.png`;
            const holderName = ticket.holder_name || ticket.ticket_name || username || 'You';

            const initials = (name) => {
              if (!name) return 'U';
              return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
            };

            return (
              <div key={ticket.ticket_id} className="grid md:grid-cols-5 gap-0 overflow-hidden rounded-2xl shadow-lg border border-slate-100">
                <div className="md:col-span-2 h-44 md:h-auto bg-cover bg-center relative" style={{ backgroundImage: `url(${ticket.events?.image || '/placeholder-event.jpg'})` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-transparent flex items-end p-4">
                    <div className="flex items-center gap-3">
                      {ownerAvatar ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                          <img src={ownerAvatar} alt="owner" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold border-2 border-white">{initials(holderName)}</div>
                      )}

                      <div className="text-white">
                        <div className="font-semibold text-lg leading-tight">{holderName}</div>
                        <div className="text-emerald-200 text-sm">{ticket.events?.title}</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-semibold">₹{ticket.events?.price || 'N/A'}</div>
                </div>

                <div className="md:col-span-3 bg-white p-4 md:p-6 flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-shrink-0">
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-inner">
                        <QRCodeCanvas value={JSON.stringify({ ticket_id: ticket.ticket_id, user_id: userId })} size={Math.min(qrSize, 160)} level="H" includeMargin={true} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500">Ticket ID</div>
                      <div className="font-mono text-sm break-all">{ticket.ticket_id}</div>
                      <div className="text-xs text-slate-500 mt-2">{ticket.events?.date} • <span className="text-emerald-600 font-medium">{ticket.events?.category}</span></div>
                      <div className="text-sm font-semibold text-slate-800 pt-1.5">{ticket.events.location}</div>
                    </div>
                                                


                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => resellTicket(ticket)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2 px-3 rounded-lg text-sm font-medium flex items-center gap-2"><RefreshCcw size={16} /> Resell</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
