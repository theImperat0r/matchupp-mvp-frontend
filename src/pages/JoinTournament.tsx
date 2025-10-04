import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTournament } from '@/contexts/TournamentContext';
import { toast } from 'sonner';

const JoinTournament = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  // prefer sync lookup for local fallback; if API is enabled use async fetch when needed
  const { getTournamentById, getTournamentByIdSync, joinTournament } = useTournament();
  const syncTournament = tournamentId ? getTournamentByIdSync(tournamentId) : undefined;
  const [tournament, setTournament] = useState<any | undefined>(syncTournament);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (tournamentId && !syncTournament) {
        const t = await getTournamentById(tournamentId);
        if (mounted) setTournament(t);
      }
    };
    load();
    return () => { mounted = false; };
  }, [tournamentId]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 text-muted mx-auto mb-4" />
            <CardTitle>Tournament Not Found</CardTitle>
            <CardDescription>
              This tournament link may be invalid or expired
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error('Please enter your nickname');
      return;
    }

    if (tournament.status !== 'upcoming') {
      toast.error('Tournament has already started');
      return;
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      toast.error('Tournament is full');
      return;
    }

    if (tournament.participants.includes(nickname)) {
      toast.error('Nickname already taken');
      return;
    }

    const success = await joinTournament(tournamentId!, nickname);
    if (success) {
      setJoined(true);
      toast.success('Successfully joined!');
      // refresh tournament if API is enabled
      const refreshed = await getTournamentById(tournamentId!);
      if (refreshed) setTournament(refreshed);
    } else {
      toast.error('Unable to join tournament');
    }
  };

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">You're In!</CardTitle>
            <CardDescription className="text-base">
              Successfully joined {tournament.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Playing as: <span className="font-bold text-foreground">{nickname}</span>
            </p>
            <Button
              onClick={() => navigate(`/player/${tournamentId}`)}
              className="w-full"
              size="lg"
            >
              View Tournament Bracket
            </Button>
            <div className="mt-2">
              <Button variant="ghost" className="w-full" onClick={() => navigate(`/player/${tournamentId}`)}>View Tournament</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">{tournament.name}</CardTitle>
          <CardDescription>
            {tournament.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(tournament.date).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spots Available:</span>
                <span className="font-medium">
                  {tournament.maxParticipants - tournament.participants.length} / {tournament.maxParticipants}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Your Nickname</Label>
              <Input
                id="nickname"
                placeholder="Enter your gaming name"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={tournament.participants.length >= tournament.maxParticipants || tournament.status !== 'upcoming'}
            >
              {tournament.status !== 'upcoming'
                ? 'Tournament Started'
                : tournament.participants.length >= tournament.maxParticipants
                ? 'Tournament Full'
                : 'Join Tournament'}
            </Button>
          </form>
          <div className="mt-4">
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/player/${tournamentId}`)}>View Tournament</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTournament;
