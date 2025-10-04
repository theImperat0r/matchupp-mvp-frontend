import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Trophy, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bracket } from '@/components/Bracket';
import { useTournament } from '@/contexts/TournamentContext';

const PlayerView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { getTournamentById, getTournamentByIdSync } = useTournament();
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
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PlayerView;
