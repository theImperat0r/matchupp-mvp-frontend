import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Trophy, Calendar, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bracket } from '@/components/Bracket';
import { useTournament } from '@/contexts/TournamentContext';

const PlayerView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { getTournamentById, getTournamentByIdSync } = useTournament();
  const syncTournament = tournamentId ? getTournamentByIdSync(tournamentId) : undefined;
  const [tournament, setTournament] = useState<any | undefined>(syncTournament);
  const [playerNick, setPlayerNick] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (tournamentId && !syncTournament) {
        const t = await getTournamentById(tournamentId);
        if (mounted) setTournament(t);
      }
    };
    load();
    try {
      const p = localStorage.getItem(`matchupp:player:${tournamentId}`);
      if (p) {
        const parsed = JSON.parse(p);
        setPlayerNick(parsed?.nickname || null);
      }
    } catch (e) {
      // ignore
    }
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
              This tournament link may be invalid
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-secondary';
      case 'ongoing':
        return 'bg-primary';
      case 'completed':
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">matchupp</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-20">
        <div className="space-y-6">
          {/* Tournament Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl mb-2">
                    {tournament.name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {tournament.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(tournament.status)}>
                  {tournament.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {new Date(tournament.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Players</div>
                    <div className="font-medium">
                      {tournament.participants.length}/{tournament.maxParticipants}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winner Announcement */}
          {tournament.winner && (
            <Card className="border-primary">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <Trophy className="h-16 w-16 text-primary mx-auto" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Tournament Complete!</h2>
                    <p className="text-lg">
                      <span className="text-muted-foreground">Champion: </span>
                      <span className="text-primary font-bold">{tournament.winner}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Bracket */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Bracket</CardTitle>
              <CardDescription>
                {tournament.status === 'upcoming' && 'Tournament has not started yet'}
                {tournament.status === 'ongoing' && 'Live bracket - updates in real-time'}
                {tournament.status === 'completed' && 'Final results'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bracket
                matches={tournament.matches}
                isClubView={false}
                highlightName={playerNick}
              />
            </CardContent>
          </Card>
          {/* show player's nickname if present */}
          {playerNick && (
            <div className="mt-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <div className="text-sm text-muted-foreground">You are playing as</div>
                  <div className="font-semibold text-lg mt-1">{playerNick}</div>
                </CardContent>
              </Card>
            </div>
          )}
            {/* QR code widget for players */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                  <div>
                    <CardTitle>Share Join Link</CardTitle>
                    <CardDescription>Players can scan the QR code or open the link to join</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-card p-4 rounded border flex-shrink-0">
                    <QRCodeSVG value={`${window.location.origin}/join/${tournament.id}`} size={140} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Input value={`${window.location.origin}/join/${tournament.id}`} readOnly className="w-full truncate" />
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${tournament.id}`); }}>Copy Link</Button>
                      <Button variant="outline" onClick={() => window.open(`${window.location.origin}/join/${tournament.id}`, '_blank')}>Open Join Page</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
};

export default PlayerView;
