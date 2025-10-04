import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Match {
  id: string;
  player1?: string;
  player2?: string;
  winner?: string;
  round: number;
  matchNumber: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  date: string;
  maxParticipants: number;
  participants: string[];
  matches: Match[];
  status: 'upcoming' | 'ongoing' | 'completed';
  clubId: string;
  winner?: string;
}

export interface Club {
  id: string;
  name: string;
  phone: string;
  password: string;
}

interface TournamentContextType {
  tournaments: Tournament[];
  clubs: Club[];
  currentClub: Club | null;
  createTournament: (tournament: Omit<Tournament, 'id' | 'participants' | 'matches' | 'status'>) => Promise<Tournament>;
  joinTournament: (tournamentId: string, playerName: string) => Promise<boolean>;
  startTournament: (tournamentId: string) => Promise<boolean>;
  updateMatch: (tournamentId: string, matchId: string, winner: string) => Promise<void>;
  registerClub: (club: Omit<Club, 'id'>) => Promise<boolean>;
  loginClub: (phone: string, password: string) => Promise<boolean>;
  logoutClub: () => void;
  getTournamentById: (id: string) => Promise<Tournament | undefined>;
  getTournamentByIdSync: (id: string) => Tournament | undefined;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);

  const API_BASE = (window as any).__API_BASE__ || '';

  const mapTournament = (data: any): Tournament => {
    return {
      ...data,
      date: new Date(data.date).toISOString(),
      participants: (data.participants || []).map((p: any) => p.name),
      matches: (data.matches || []).map((m: any) => ({ ...m })),
    };
  };

  // on mount, if API is configured, load tournaments and clubs into state
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!API_BASE) return;
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/api/tournaments`),
          fetch(`${API_BASE}/api/tournaments/club`),
        ]);
        if (!tRes.ok || !cRes.ok) return;
        const tData = await tRes.json();
        const cData = await cRes.json();
        if (!mounted) return;
        setTournaments(tData.map((d: any) => mapTournament(d)));
        setClubs(cData || []);
      } catch (err) {
        // ignore - keep fallback
        console.warn('Unable to load tournaments/clubs from API', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'participants' | 'matches' | 'status'>) => {
    if (!API_BASE) {
      const newTournament: Tournament = {
        ...tournamentData,
        id: Math.random().toString(36).substr(2, 9),
        participants: [],
        matches: [],
        status: 'upcoming',
      };
      setTournaments(prev => [...prev, newTournament]);
      return newTournament;
    }

    const res = await fetch(`${API_BASE}/api/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tournamentData),
    });
    if (!res.ok) throw new Error('Create tournament failed');
    const data = await res.json();
    const mapped = { ...data, participants: [], matches: [], date: new Date(data.date).toISOString() } as Tournament;
    // add to local state so dashboard picks it up
    setTournaments(prev => [...prev, mapped]);
    return mapped;
  };

  const generateBracket = (participants: string[]): Match[] => {
    const matches: Match[] = [];
    const numRounds = Math.ceil(Math.log2(participants.length));
    
    // First round matches
    for (let i = 0; i < participants.length; i += 2) {
      matches.push({
        id: Math.random().toString(36).substr(2, 9),
        player1: participants[i],
        player2: participants[i + 1] || undefined,
        round: 1,
        matchNumber: Math.floor(i / 2) + 1,
      });
    }

    // Generate placeholder matches for subsequent rounds
    let previousRoundMatches = matches.length;
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.ceil(previousRoundMatches / 2);
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          id: Math.random().toString(36).substr(2, 9),
          round,
          matchNumber: i + 1,
        });
      }
      previousRoundMatches = matchesInRound;
    }

    return matches;
  };

  const joinTournament = async (tournamentId: string, playerName: string) => {
    if (!API_BASE) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return false;
      if (tournament.status !== 'upcoming') return false;
      if (tournament.participants.length >= tournament.maxParticipants) return false;
      setTournaments(prev => prev.map(t => {
        if (t.id === tournamentId) {
          return { ...t, participants: [...t.participants, playerName] };
        }
        return t;
      }));
      return true;
    }

    const res = await fetch(`${API_BASE}/api/tournaments/${tournamentId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });
    if (res.ok) {
      // refresh the tournament in state
      const tRes = await fetch(`${API_BASE}/api/tournaments/${tournamentId}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        const mapped = mapTournament(tData);
        setTournaments(prev => prev.map(p => p.id === mapped.id ? mapped : p));
      }
    }
    return res.ok;
  };

  const startTournament = async (tournamentId: string) => {
    if (!API_BASE) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return false;
      if (tournament.participants.length < 2) return false;
      setTournaments(prev => prev.map(t => {
        if (t.id === tournamentId) {
          return { ...t, matches: generateBracket(t.participants), status: 'ongoing' as const };
        }
        return t;
      }));
      return true;
    }

    const res = await fetch(`${API_BASE}/api/tournaments/${tournamentId}/start`, { method: 'POST' });
    if (res.ok) {
      const tRes = await fetch(`${API_BASE}/api/tournaments/${tournamentId}`);
      if (tRes.ok) {
        const tData = await tRes.json();
        const mapped = mapTournament(tData);
        setTournaments(prev => prev.map(p => p.id === mapped.id ? mapped : p));
      }
    }
    return res.ok;
  };

  const updateMatch = async (tournamentId: string, matchId: string, winner: string) => {
    if (!API_BASE) {
      setTournaments(prev => prev.map(t => {
        if (t.id === tournamentId) {
          const updatedMatches = t.matches.map(m => (m.id === matchId ? { ...m, winner } : m));
          // advance locally (omitted for brevity)
          return { ...t, matches: updatedMatches };
        }
        return t;
      }));
      return;
    }

    await fetch(`${API_BASE}/api/tournaments/${tournamentId}/match/${matchId}/winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner }),
    });
    // refresh tournament
    const tRes = await fetch(`${API_BASE}/api/tournaments/${tournamentId}`);
    if (tRes.ok) {
      const tData = await tRes.json();
      const mapped = mapTournament(tData);
      setTournaments(prev => prev.map(p => p.id === mapped.id ? mapped : p));
    }
  };

  const registerClub = async (clubData: Omit<Club, 'id'>) => {
    if (!API_BASE) {
      if (clubs.some(c => c.phone === clubData.phone)) return false;
      const newClub: Club = { ...clubData, id: Math.random().toString(36).substr(2, 9) };
      setClubs(prev => [...prev, newClub]);
      setCurrentClub(newClub);
      return true;
    }

    const res = await fetch(`${API_BASE}/api/tournaments/club`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubData),
    });
    if (!res.ok) return false;
    const club = await res.json();
    setCurrentClub(club);
    return true;
  };

  const loginClub = async (phone: string, password: string) => {
    if (!API_BASE) {
      const club = clubs.find(c => c.phone === phone && c.password === password);
      if (club) { setCurrentClub(club); return true; }
      return false;
    }

    // naive login: fetch clubs and find match (consider replacing with real auth)
    const res = await fetch(`${API_BASE}/api/tournaments/club`);
    if (!res.ok) return false;
    const allClubs = await res.json();
    const club = allClubs.find((c: any) => c.phone === phone && c.password === password);
    if (club) { setCurrentClub(club); return true; }
    return false;
  };

  const logoutClub = () => {
    setCurrentClub(null);
  };

  const getTournamentById = async (id: string) => {
    if (!API_BASE) return tournaments.find(t => t.id === id);
    const res = await fetch(`${API_BASE}/api/tournaments/${id}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    // map to frontend Tournament shape
    return {
      ...data,
      date: new Date(data.date).toISOString(),
      participants: data.participants.map((p: any) => p.name),
      matches: data.matches.map((m: any) => ({ ...m })),
    } as Tournament;
  };

  const getTournamentByIdSync = (id: string) => {
    return tournaments.find(t => t.id === id);
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        clubs,
        currentClub,
        createTournament,
        joinTournament,
        startTournament,
        updateMatch,
        registerClub,
        loginClub,
        logoutClub,
        getTournamentById,
        getTournamentByIdSync,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
};
