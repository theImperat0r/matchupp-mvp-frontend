import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { useTournament } from '@/contexts/TournamentContext';

const Dashboard = () => {
  const { tournaments, currentClub } = useTournament();
  const clubTournaments = tournaments.filter(t => t.clubId === currentClub?.id);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {currentClub?.name}</h1>
            <p className="text-muted-foreground">Manage your tournaments and track progress</p>
          </div>
          <Link to="/create">
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Create Tournament
            </Button>
          </Link>
        </div>

        {clubTournaments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-16 w-16 text-muted mb-4" />
              <h2 className="text-xl font-bold mb-2">No tournaments yet</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Create your first tournament to get started
              </p>
              <Link to="/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl line-clamp-1">
                        {tournament.name}
                      </CardTitle>
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {tournament.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(tournament.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {tournament.participants.length}/{tournament.maxParticipants} players
                        </span>
                      </div>
                      {tournament.winner && (
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="font-medium">Winner: {tournament.winner}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
