import { Trophy, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Match } from '@/contexts/TournamentContext';

interface BracketProps {
  matches: Match[];
  onWinnerSelect?: (matchId: string, winner: string) => void;
  isClubView?: boolean;
  highlightPlayer?: string;
}

export const Bracket = ({ matches, onWinnerSelect, isClubView = false, highlightPlayer }: BracketProps) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No bracket available yet
      </div>
    );
  }

  const rounds = Math.max(...matches.map(m => m.round));
  const matchesByRound: { [key: number]: Match[] } = {};
  
  for (let i = 1; i <= rounds; i++) {
    matchesByRound[i] = matches.filter(m => m.round === i);
  }

  const getRoundName = (round: number) => {
    if (round === rounds) return 'Final';
    if (round === rounds - 1) return 'Semi-Finals';
    if (round === rounds - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  const isPlayerInMatch = (match: Match) => {
    if (!highlightPlayer) return false;
    return match.player1 === highlightPlayer || match.player2 === highlightPlayer;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex gap-8 min-w-full justify-center px-4">
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-4 min-w-[280px]">
            <h3 className="text-sm font-bold text-center text-muted-foreground uppercase tracking-wider mb-2">
              {getRoundName(Number(round))}
            </h3>
            <div className="flex flex-col gap-6">
              {roundMatches.map((match) => (
                <Card 
                  key={match.id}
                  className={`border-2 transition-all ${
                    isPlayerInMatch(match) 
                      ? 'ring-2 ring-primary border-primary shadow-lg' 
                      : match.winner 
                        ? 'border-muted bg-muted/5' 
                        : 'border-border hover:border-primary-light'
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Player 1 */}
                    <div className={`p-4 border-b flex items-center justify-between transition-colors ${
                      match.winner === match.player1 
                        ? 'bg-primary text-primary-foreground font-bold' 
                        : match.player1 
                          ? 'hover:bg-accent/50' 
                          : 'bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        {match.winner === match.player1 ? (
                          <Trophy className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${!match.player1 ? 'text-muted-foreground italic' : ''}`}>
                          {match.player1 || 'TBD'}
                        </span>
                      </div>
                      {isClubView && match.player1 && match.player2 && !match.winner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-3 text-xs hover:bg-primary hover:text-primary-foreground"
                          onClick={() => onWinnerSelect?.(match.id, match.player1!)}
                        >
                          Win
                        </Button>
                      )}
                    </div>

                    {/* VS Divider */}
                    <div className="bg-card py-1">
                      <div className="text-center text-xs font-bold text-muted-foreground">VS</div>
                    </div>

                    {/* Player 2 */}
                    <div className={`p-4 flex items-center justify-between transition-colors ${
                      match.winner === match.player2 
                        ? 'bg-primary text-primary-foreground font-bold' 
                        : match.player2 
                          ? 'hover:bg-accent/50' 
                          : 'bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        {match.winner === match.player2 ? (
                          <Trophy className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${!match.player2 ? 'text-muted-foreground italic' : ''}`}>
                          {match.player2 || 'TBD'}
                        </span>
                      </div>
                      {isClubView && match.player1 && match.player2 && !match.winner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-3 text-xs hover:bg-primary hover:text-primary-foreground"
                          onClick={() => onWinnerSelect?.(match.id, match.player2!)}
                        >
                          Win
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
