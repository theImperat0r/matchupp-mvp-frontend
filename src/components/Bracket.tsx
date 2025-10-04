import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Match } from '@/contexts/TournamentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { useTournament } from '@/contexts/TournamentContext';
import { useNavigate } from 'react-router-dom';

interface BracketProps {
  matches: Match[];
  onWinnerSelect?: (matchId: string, winner: string) => void;
  isClubView?: boolean;
}

// Helper: map a numeric round to a friendly label (Final/Semifinal/Quarterfinal or Round N)
const formatRoundLabel = (roundNumber: number, totalRounds: number) => {
  const diff = totalRounds - roundNumber;
  if (diff === 0) return 'Final';
  if (diff === 1) return 'Semifinal';
  if (diff === 2) return 'Quarterfinal';
  return `Round ${roundNumber}`;
};

const RoundRow = ({ title, matches, onClickMatch }: any) => (
  <div className="flex flex-col gap-3 w-full">
    <div className="text-center text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</div>
    <div className="flex gap-4 justify-center flex-wrap">
      {matches.map((m: Match) => (
        <div key={m.id} className="cursor-pointer" onClick={() => onClickMatch(m)}>
          <Card className={`border ${m.winner ? 'bg-muted/5' : 'hover:shadow-lg'} w-64 max-w-[16rem]`}> 
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-muted-foreground">#{m.matchNumber}</div>
                <div className="text-xs text-muted-foreground">R{m.round}</div>
              </div>
              <div className={`p-2 rounded truncate ${m.winner === m.player1 ? 'bg-primary text-primary-foreground font-bold' : ''}`}>
                <div className="text-sm truncate">{m.player1 || 'TBD'}</div>
              </div>
              <div className="text-xs text-center text-muted-foreground py-1">VS</div>
              <div className={`p-2 rounded truncate ${m.winner === m.player2 ? 'bg-primary text-primary-foreground font-bold' : ''}`}>
                <div className="text-sm truncate">{m.player2 || 'TBD'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  </div>
);

export const Bracket = ({ matches, onWinnerSelect, isClubView = false }: BracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [open, setOpen] = useState(false);
  const { currentClub } = useTournament();
  const navigate = useNavigate();

  if (!matches || matches.length === 0) return <div className="py-12 text-muted-foreground text-center">No bracket available yet</div>;

  const rounds = Math.max(...matches.map(m => m.round));
  const matchesByRound: { [key: number]: Match[] } = {};
  for (let i = 1; i <= rounds; i++) matchesByRound[i] = matches.filter(m => m.round === i);

  const openMatch = (m: Match) => {
    setSelectedMatch(m);
    setOpen(true);
  };

  const handleWin = (winner: string) => {
    if (!selectedMatch) return;
    onWinnerSelect?.(selectedMatch.id, winner);
    setOpen(false);
    setSelectedMatch(null);
  };

  return (
    <div>
      <TransformWrapper initialScale={0.9} minScale={0.5} maxScale={2} centerOnInit>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div>
            <div className="flex gap-2 mb-3 items-center">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => zoomIn()}>Zoom In</Button>
                <Button size="sm" variant="outline" onClick={() => zoomOut()}>Zoom Out</Button>
                <Button size="sm" variant="ghost" onClick={() => resetTransform()}>Reset</Button>
              </div>
              {currentClub && (
                <div className="ml-auto">
                  <Button size="sm" variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
              )}
            </div>
            <div className="border p-2 rounded overflow-auto max-h-[65vh]">
              <TransformComponent>
                <div className="flex flex-col gap-6 px-4">
                  {Object.entries(matchesByRound).map(([round, roundMatches], idx, arr) => (
                    <div key={round} className={`relative ${idx < arr.length - 1 ? '' : ''}`}>
                      <RoundRow title={formatRoundLabel(Number(round), rounds)} matches={roundMatches} onClickMatch={openMatch} />
                      {/* center final visually */}
                      {arr.length - Number(round) === 0 && (
                        <div className="w-full flex justify-center mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </TransformComponent>
            </div>
          </div>
        )}
      </TransformWrapper>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              Choose the winner to advance to the next round
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Player 1</div>
              <div className="text-lg font-semibold">{selectedMatch?.player1 || 'TBD'}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Player 2</div>
              <div className="text-lg font-semibold">{selectedMatch?.player2 || 'TBD'}</div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 items-center">
              <Button onClick={() => setOpen(false)} variant="outline">Cancel</Button>
              {/* Only a logged-in club may assign winners */}
              <div className="flex gap-2">
                <Button disabled={!currentClub || !selectedMatch?.player1} onClick={() => handleWin(selectedMatch!.player1!)}>{selectedMatch?.player1 ? `Give Win to ${selectedMatch.player1}` : 'No Player'}</Button>
                <Button disabled={!currentClub || !selectedMatch?.player2} onClick={() => handleWin(selectedMatch!.player2!)}>{selectedMatch?.player2 ? `Give Win to ${selectedMatch.player2}` : 'No Player'}</Button>
              </div>
              {!currentClub && (
                <div className="text-xs text-muted-foreground ml-3">Only club accounts can assign winners</div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
