'use client';

import React, { useEffect, useState } from 'react';
import { Ticket, RefreshCcw } from 'lucide-react';
import { subscribeToUserTickets, getUserAvatarUrl, getUserProfile } from '../../lib/supabase/database';
// QR code component will be dynamically imported on client to avoid SSR issues
// import { QRCodeCanvas } from 'qrcode.react';

export function MyTickets({ myTickets, resellTicket, setView, userId, userName, avatarUrl }) {
  const [qrSize, setQrSize] = useState(220);
  const [username, setUsername] = useState(userName || null);
  const [avatarMap, setAvatarMap] = useState({});
  // currently downloading ticket id (used to disable buttons)
  const [downloadingId, setDownloadingId] = useState(null);
  // QR component (lazy loaded) - avoid importing during SSR/hydration issues
  const [QRCodeComponent, setQRCodeComponent] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('qrcode.react');
        if (mounted && mod?.QRCodeCanvas) setQRCodeComponent(() => mod.QRCodeCanvas);
        console.debug('QRCode component loaded');
      } catch (err) {
        console.error('Failed to load QRCode component', err);
      }
    })();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const subscription = subscribeToUserTickets(userId, () => {});
    return () => subscription?.unsubscribe?.();
  }, [userId]);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window === 'undefined') return;
      setQrSize(window.innerWidth < 640 ? 140 : 180);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!myTickets?.length) return;
    const owners = [...new Set(myTickets.map(t => t.owner_id).filter(Boolean))];
    const toFetch = owners.filter(id => !avatarMap[id]);
    if (!toFetch.length) return;

    const next = {};
    toFetch.forEach(id => {
      try {
        next[id] = getUserAvatarUrl(id) || null;
      } catch {
        next[id] = null;
      }
    });
    setAvatarMap(prev => ({ ...prev, ...next }));
  }, [myTickets]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return setUsername(null);
      try {
        const profile = await getUserProfile(userId);
        setUsername(profile?.full_name || userName || null);
      } catch {
        setUsername(userName || null);
      }
    };
    fetchProfile();
  }, [userId, userName]);

  const handleDownload = async (ticket, type) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(`ticket-${ticket.ticket_id}`);
    console.debug('starting download', ticket?.ticket_id, type);
    if (!el) return;

    // helper: inline external images/backgrounds into the cloned node (improves chance html2canvas won't be tainted)
    const inlineImages = async (root) => {
      const nodes = root.querySelectorAll('*');
      for (const node of nodes) {
        try {
          const bg = window.getComputedStyle(node).backgroundImage;
          if (bg && bg !== 'none') {
            const m = /url\((['"]?)(.*?)\1\)/.exec(bg);
            if (m && m[2]) {
              const url = m[2];
              try {
                const res = await fetch(url, { mode: 'cors' });
                if (!res.ok) throw new Error('fetch failed');
                const blob = await res.blob();
                const dataUrl = await new Promise(resolve => {
                  const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob);
                });
                node.style.backgroundImage = `url("${dataUrl}")`;
              } catch (e) {
                console.debug('Could not inline background image', e);
              }
            }
          }
          if (node.tagName === 'IMG' && node.src) {
            try {
              const res = await fetch(node.src, { mode: 'cors' });
              if (!res.ok) throw new Error('fetch failed');
              const blob = await res.blob();
              const dataUrl = await new Promise(resolve => {
                const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob);
              });
              node.src = dataUrl;
            } catch (e) {
              console.debug('Could not inline img', e);
            }
          }
        } catch (e) {
          // ignore per-node errors
        }
      }
    };

    setDownloadingId(ticket.ticket_id);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      // clone element and render off-screen so we can modify it safely
      const clone = el.cloneNode(true);
      clone.style.boxSizing = 'border-box';
      clone.style.width = `${el.offsetWidth}px`;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);
      // attempt to inline images/backgrounds (best-effort)
      await inlineImages(clone);
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, allowTaint: false });
      document.body.removeChild(clone);

      if (type === 'image') {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `ticket-${ticket.ticket_id}.png`;
        a.click();
      } else {
        const img = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'pt', 'a4');
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(img, 'PNG', 0, 0, width, height);
        pdf.save(`ticket-${ticket.ticket_id}.pdf`);
      }
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to capture ticket for download. This often happens when event images are hosted on another origin without CORS headers.');
    } finally {
      setDownloadingId(null);
    }
  }; 

  const initials = name =>
    name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Secure Tickets</h2>

      {myTickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Ticket size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">You haven’t purchased any tickets yet.</p>
          <button
            onClick={() => setView('marketplace')}
            className="mt-4 text-emerald-600 font-medium hover:underline"
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myTickets.map(ticket => {
            const ownerAvatar =
              avatarMap[ticket.owner_id] || avatarUrl || `/avatars/${userId}.png`;
            const holderName =
              ticket.holder_name || ticket.ticket_name || username || 'You';

            return (
              <div
                id={`ticket-${ticket.ticket_id}`}
                key={ticket.ticket_id}
                className="flex flex-col md:grid md:grid-cols-5 overflow-hidden rounded-2xl shadow-lg border border-slate-100"
              >
                {/* IMAGE */}
                <div
                  className="md:col-span-2 h-36 sm:h-44 md:h-auto bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${ticket.events?.image || '/placeholder-event.jpg'})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-transparent flex items-end p-4">
                    <div className="flex items-center gap-3">
                      {ownerAvatar ? (
                        <img
                          src={ownerAvatar}
                          alt="owner"
                          className="w-12 h-12 rounded-full border-2 border-white object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold border-2 border-white">
                          {initials(holderName)}
                        </div>
                      )}
                      <div className="text-white">
                        <div className="font-semibold leading-tight">{holderName}</div>
                        <div className="text-emerald-200 text-sm">
                          {ticket.events?.title}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    ₹{ticket.events?.price || 'N/A'}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="md:col-span-3 bg-white p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    {/* QR */}
                      {QRCodeComponent ? (
                        <div className="bg-white p-2 rounded-lg border-none shadow-inner">
                          <QRCodeComponent
                            value={JSON.stringify({ ticket_id: ticket.ticket_id, user_id: userId, event_id: ticket.event_id || ticket.events?.id })}
                            size={qrSize}
                            level="H"
                            includeMargin
                          />
                          {/* debug: expose QR payload for quick inspection */}
                          <div className="sr-only" data-qr-value={JSON.stringify({ ticket_id: ticket.ticket_id, user_id: userId, event_id: ticket.event_id || ticket.events?.id })} />
                        </div>
                      ) : (
                        <div className="bg-white p-2 rounded-lg border-none shadow-inner">
                          <div className="w-32 h-32 bg-slate-50 rounded flex items-center justify-center text-slate-400 text-xs">QR loading</div>
                        </div>
                      )}

                    {/* INFO */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="text-xs text-slate-500">Ticket ID</div>
                      <div className="font-mono text-sm break-all">
                        {ticket.ticket_id}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        {ticket.events?.date}{' '}
                        <span className="text-emerald-600 font-medium">
                          • {ticket.events?.category}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 pt-1">
                        {ticket.events?.location}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="w-full sm:w-auto flex flex-col gap-2">
                      <button
                        onClick={() => resellTicket(ticket)}
                        className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <RefreshCcw size={16} /> Resell
                      </button>
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
