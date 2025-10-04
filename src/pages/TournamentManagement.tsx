import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Calendar, Users, Trophy, ArrowLeft, Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
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

          {/* Bracket (always visible; players seen before start) */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Bracket</CardTitle>
              <CardDescription>
                {tournament.status === 'upcoming' && 'Bracket (players shown even before start)'}
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

          {/* QR code widget */}
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

export default TournamentManagement;
