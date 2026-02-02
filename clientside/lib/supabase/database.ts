import { createClient } from './clients';

export const subscribeToUserProfile = (userId: string, callback: (data: Record<string, unknown>) => void) => {
  const supabase = createClient();
  const subscription = supabase
    .channel(`user_profile:${userId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${userId}` },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

export const subscribeToEvents = (callback: (data: Record<string, unknown>) => void) => {
  const supabase = createClient();
  const subscription = supabase
    .channel('events:all')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: 'is_active=eq.true' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

export const subscribeToUserTickets = (userId: string, callback: (data: Record<string, unknown>) => void) => {
  const supabase = createClient();
  console.log('Subscribing to tickets for user:', userId)
  const subscription = supabase
    .channel(`tickets:${userId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tickets', filter: `owner_id=eq.${userId}` },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

export const subscribeToLedger = (callback: (data: Record<string, unknown>) => void) => {
  const supabase = createClient();
  const subscription = supabase
    .channel('ledger:all')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ledger' },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

// --- USER FUNCTIONS ---
export const getUserProfile = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) console.error('Error fetching user profile:', error);
  return data;
};

export const updateUserProfile = async (userId: string, profileData: Record<string, unknown>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...profileData, updated_at: new Date() })
    .select()
    .single();

  if (error) console.error('Error updating user profile:', error);
  return data;
};

export const uploadUserAvatar = async (userId: string, file: File) => {
  const supabase = createClient();

  // Always use .png for internal storage consistency
  const fileName = `${userId}.png`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    });

  if (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }

  return fileName;
};

export const getUserAvatarUrl = (userId: string) => {
  const supabase = createClient();
  const timestamp = Date.now();

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}.png`);

  console.log("Try kiya at timestamdp:", timestamp, ") from usl:", data.publicUrl);
  return data.publicUrl;
};



export const createUserProfile = async (userId: string, fullName: string, email: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: userId,
        full_name: fullName,
        email: email,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) console.error('Error creating user profile:', error);
  return data;
};

// --- EVENTS FUNCTIONS ---
export const getAllEvents = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (error) console.error('Error fetching events:', error);
  return data || [];
};

export const getEventById = async (eventId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) console.error('Error fetching event:', error);
  return data;
};

export const createEvent = async (eventData: Record<string, unknown>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        ...eventData,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) console.error('Error creating event:', error);
  return data;
};

export const updateEvent = async (eventId: string, eventData: Record<string, unknown>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .update({
      ...eventData,
      updated_at: new Date(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) console.error('Error updating event:', error);
  return data;
};

export const deleteEvent = async (eventId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .update({ is_active: false })
    .eq('id', eventId)
    .select();

  if (error) console.error('Error deleting event:', error);
  return data;
};

// --- ADMIN CHECK ---
export const isUserAdmin = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) console.error('Error checking admin status:', error);
  return data?.is_admin || false;
};

// --- TICKETS FUNCTIONS ---
export const getUserTickets = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*, events(*)')
    .eq('owner_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching user tickets:', error);
  return data || [];
};

export const createTicket = async (ticketData: Record<string, unknown>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tickets')
    .insert([
      {
        ...ticketData,
        created_at: new Date().toISOString(),
      },
    ])
    .select('*, events(*)')
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    throw new Error(error.message || 'Failed to create ticket');
  }
  return data;
};

export const resellTicket = async (
  ticketId: string,
  userId: string,
  refundAmount: number
) => {
  // 1. Mark ticket as returned
  const ticket = await returnTicket(ticketId);
  if (!ticket) throw new Error('Ticket return failed');

  // 2. Refund user
  await updateUserBalance(userId, refundAmount, 'Ticket resale refund');

  // 3. Ledger entry
  await addLedgerEntry('TICKET_RESALE', {
    ticketId,
    userId,
    refundAmount,
  });

  return ticket;
};




export const returnTicket = async (ticketId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tickets')
    .update({ status: 'RETURNED' })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) console.error('Error returning ticket:', error);
  return data;
};

// --- LEDGER FUNCTIONS ---
export const addLedgerEntry = async (type: string, details: Record<string, unknown>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ledger')
    .insert([
      {
        type,
        details,
        created_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) console.error('Error adding ledger entry:', error);
  return data;
};

export const getLedgerHistory = async (limit: number = 50) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ledger')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) console.error('Error fetching ledger:', error);
  return data || [];
};

export const getUserProfilesByIds = async (userIds: string[]) => {
  if (!userIds?.length) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching user profiles by ids:', error);
    return [];
  }

  return data || [];
};

export const getUserBalance = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user balance:', error);
    throw error;
  }

  return data.balance;
};

export const updateUserBalance = async (
  userId: string,
  delta: number, // +credit or -debit
  reason: string
) => {
  const supabase = createClient();

  // Fetch current balance
  const { data: user, error: fetchErr } = await supabase
    .from('user_profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (fetchErr) throw fetchErr;

  const newBalance = Number(user.balance || 0) + delta;

  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }

  // Update balance
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      balance: newBalance,
      updated_at: new Date(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Ledger entry (financial)
  await addLedgerEntry('BALANCE_UPDATE', {
    userId,
    delta,
    newBalance,
    reason,
  });

  return data;
};

