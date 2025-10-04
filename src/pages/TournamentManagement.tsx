import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Calendar, Users, Trophy, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { Bracket } from '@/components/Bracket';
import { useTournament } from '@/contexts/TournamentContext';
import { toast } from 'sonner';

const TournamentManagement = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { getTournamentById, getTournamentByIdSync, updateMatch, startTournament } = useTournament();
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 text-muted mx-auto mb-4" />
              <h2 className="text-xl font-bold">Tournament not found</h2>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleWinnerSelect = async (matchId: string, winner: string) => {
    await updateMatch(tournamentId!, matchId, winner);
    // refresh
    const t = await getTournamentById(tournamentId!);
    if (t) setTournament(t);
    toast.success(`${winner} wins!`);
  };

  const handleStartTournament = async () => {
    const success = await startTournament(tournamentId!);
    if (success) {
      const t = await getTournamentById(tournamentId!);
      if (t) setTournament(t);
      toast.success('Tournament started!');
    } else {
      toast.error('Need at least 2 participants to start');
    }
  };

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Tournament Info */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl mb-2">{tournament.name}</CardTitle>
                  <CardDescription className="text-base">
                    {tournament.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(tournament.status)}>
                    {tournament.status}
                  </Badge>
                  {tournament.status === 'upcoming' && tournament.participants.length >= 2 && (
                    <Button onClick={handleStartTournament} size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start Tournament
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="text-sm text-muted-foreground">Participants</div>
                    <div className="font-medium">
                      {tournament.participants.length}/{tournament.maxParticipants}
                    </div>
                  </div>
                </div>
                {tournament.winner && (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Champion</div>
                      <div className="font-medium text-primary">{tournament.winner}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          {tournament.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Registered Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tournament.participants.map((player, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {player}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bracket */}
          {tournament.status !== 'upcoming' && (
            <Card>
              <CardHeader>
                <CardTitle>Tournament Bracket</CardTitle>
                <CardDescription>
                  {tournament.status === 'ongoing' && 'Select winners to advance the bracket'}
                  {tournament.status === 'completed' && 'Tournament completed!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Bracket
                  matches={tournament.matches}
                  onWinnerSelect={handleWinnerSelect}
                  isClubView={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TournamentManagement;
