import React, { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, Maximize2, Check, Trophy, ChevronLeft, ChevronRight, Crown } from 'lucide-react';

// Match type definition
interface Match {
  id: string;
  matchNumber: number;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  score?: string;
}

interface BracketProps {
  matches: Match[];
  onWinnerSelect?: (matchId: string, winner: string) => void;
  currentClub?: any;
  highlightName?: string | null;
}

const formatRoundLabel = (roundNumber: number, totalRounds: number) => {
  const diff = totalRounds - roundNumber;
  if (diff === 0) return 'Final';
  if (diff === 1) return 'Semifinals';
  if (diff === 2) return 'Quarterfinals';
  if (diff === 3) return 'Round of 16';
  return `Round ${roundNumber}`;
};

const MatchCard = ({ match, onClick, highlightName, isCompact = false }: any) => {
  const isFinished = !!match.winner;
  const player1Won = match.winner === match.player1;
  const player2Won = match.winner === match.player2;
  const isFinal = match.round === Math.max(...[match.round]);
  
  return (
    <div 
      className={`cursor-pointer transition-all duration-200 ${isCompact ? 'w-52' : 'w-full max-w-sm'}`}
      onClick={() => onClick(match)}
    >
      <Card className={`border-2 transition-all hover:scale-[1.02] ${
        isFinished 
          ? 'border-emerald-500 bg-white shadow-md' 
          : 'border-slate-200 hover:border-blue-500 hover:shadow-lg bg-white'
      }`}>
        <CardContent className="p-4">
          {/* Match Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-slate-600">
                #{match.matchNumber}
              </div>
              {isFinal && <Crown className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="text-xs px-2.5 py-1 rounded-full bg-blue-500 text-white font-semibold">
              R{match.round}
            </div>
          </div>

          {/* Player 1 */}
          <div className={`p-3 rounded-xl mb-2 transition-all border-2 ${
            player1Won 
              ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
              : isFinished 
                ? 'border-slate-200 bg-slate-50 opacity-60'
                : 'border-slate-200 bg-white hover:border-blue-300'
          } ${highlightName === match.player1 ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm truncate flex-1 ${player1Won ? 'font-bold text-emerald-900' : 'font-medium text-slate-700'}`}>
                {match.player1 || 'TBD'}
              </span>
              {player1Won && (
                <div className="ml-2 bg-emerald-500 rounded-full p-1">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center my-2">
            <div className="text-xs font-bold text-slate-400 px-3 py-1 rounded-full bg-slate-100">
              VS
            </div>
          </div>

          {/* Player 2 */}
          <div className={`p-3 rounded-xl transition-all border-2 ${
            player2Won 
              ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
              : isFinished 
                ? 'border-slate-200 bg-slate-50 opacity-60'
                : 'border-slate-200 bg-white hover:border-blue-300'
          } ${highlightName === match.player2 ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm truncate flex-1 ${player2Won ? 'font-bold text-emerald-900' : 'font-medium text-slate-700'}`}>
                {match.player2 || 'TBD'}
              </span>
              {player2Won && (
                <div className="ml-2 bg-emerald-500 rounded-full p-1">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>

          {/* Score if available */}
          {match.score && (
            <div className="text-xs text-center text-slate-500 mt-3 font-medium">
              {match.score}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const RoundColumn = ({ title, matches, onClickMatch, highlightName, isCompact }: any) => (
  <div className="flex flex-col items-center min-w-fit">
    <div className="text-center mb-6 sticky top-0 bg-white py-3 z-10">
      <div className="text-sm font-bold text-slate-700 uppercase tracking-wide px-4 py-2 rounded-xl bg-slate-100 border-2 border-slate-200">
        {title}
      </div>
    </div>
    <div className="flex flex-col gap-8 items-center justify-center flex-1">
      {matches.map((m: Match) => (
        <MatchCard 
          key={m.id} 
          match={m} 
          onClick={onClickMatch} 
          highlightName={highlightName}
          isCompact={isCompact}
        />
      ))}
    </div>
  </div>
);

export const Bracket = ({ matches, onWinnerSelect, currentClub, highlightName }: BracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [open, setOpen] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="bg-slate-100 rounded-full p-6 mb-4">
          <Trophy className="w-12 h-12 text-slate-300" />
        </div>
        <p className="text-lg font-medium">No bracket available yet</p>
      </div>
    );
  }

  const rounds = Math.max(...matches.map(m => m.round));
  const matchesByRound: { [key: number]: Match[] } = {};
  for (let i = 1; i <= rounds; i++) {
    matchesByRound[i] = matches.filter(m => m.round === i);
  }

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

  const goToNextRound = () => {
    if (currentRound < rounds) setCurrentRound(currentRound + 1);
  };

  const goToPrevRound = () => {
    if (currentRound > 1) setCurrentRound(currentRound - 1);
  };

  // Mobile view - show one round at a time
  if (isMobileView) {
    return (
      <div className="w-full px-4">
        {/* Mobile Controls */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl border-2 border-slate-200 p-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={goToPrevRound}
            disabled={currentRound === 1}
            className="rounded-lg border-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center px-2">
            <div className="text-xs text-slate-500 font-medium mb-0.5">
              Round {currentRound} of {rounds}
            </div>
            <div className="font-bold text-slate-800 text-sm">
              {formatRoundLabel(currentRound, rounds)}
            </div>
          </div>

          <Button 
            size="sm" 
            variant="outline"
            onClick={goToNextRound}
            disabled={currentRound === rounds}
            className="rounded-lg border-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Round Progress Indicator */}
        <div className="flex gap-1.5 mb-6 justify-center">
          {Array.from({ length: rounds }, (_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 === currentRound 
                  ? 'w-8 bg-blue-500' 
                  : i + 1 < currentRound 
                    ? 'w-6 bg-emerald-500' 
                    : 'w-6 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Mobile Bracket View */}
        <div className="space-y-4 pb-6">
          {matchesByRound[currentRound]?.map((m: Match) => (
            <MatchCard 
              key={m.id} 
              match={m} 
              onClick={openMatch} 
              highlightName={highlightName}
            />
          ))}
        </div>

        {/* Match Dialog */}
        <MatchDialog 
          open={open}
          setOpen={setOpen}
          selectedMatch={selectedMatch}
          currentClub={currentClub}
          handleWin={handleWin}
        />
      </div>
    );
  }

  // Desktop view - full bracket with zoom
  return (
    <div className="w-full">
      <TransformWrapper 
        initialScale={0.8} 
        minScale={0.3} 
        maxScale={1.5}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div>
            {/* Desktop Controls */}
            <div className="flex gap-3 mb-4 items-center justify-between flex-wrap">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => zoomIn()} className="gap-2 rounded-lg">
                  <ZoomIn className="w-4 h-4" />
                  Zoom In
                </Button>
                <Button size="sm" variant="outline" onClick={() => zoomOut()} className="gap-2 rounded-lg border-2">
                  <ZoomOut className="w-4 h-4" />
                  Zoom Out
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resetTransform()} className="gap-2 rounded-lg">
                  <Maximize2 className="w-4 h-4" />
                  Reset
                </Button>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Double-click to zoom • Drag to pan
              </div>
            </div>

            {/* Bracket Container */}
            <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-auto" style={{ height: '70vh' }}>
                <TransformComponent>
                  <div className="flex gap-12 p-8 min-h-full items-center">
                    {Object.entries(matchesByRound).map(([round, roundMatches]) => (
                      <React.Fragment key={round}>
                        <RoundColumn 
                          title={formatRoundLabel(Number(round), rounds)} 
                          matches={roundMatches} 
                          onClickMatch={openMatch}
                          highlightName={highlightName}
                          isCompact={rounds > 4}
                        />
                        {/* Connecting lines between rounds */}
                        {Number(round) < rounds && (
                          <div className="flex items-center">
                            <svg width="40" height="100%" className="text-slate-300">
                              <line x1="0" y1="50%" x2="40" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                            </svg>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </TransformComponent>
              </div>
            </div>
          </div>
        )}
      </TransformWrapper>

      {/* Match Dialog */}
      <MatchDialog 
        open={open}
        setOpen={setOpen}
        selectedMatch={selectedMatch}
        currentClub={currentClub}
        handleWin={handleWin}
      />
    </div>
  );
};

// Separate Match Dialog Component
const MatchDialog = ({ open, setOpen, selectedMatch, currentClub, handleWin }: any) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <Trophy className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-base">Match #{selectedMatch?.matchNumber}</div>
            <div className="text-sm font-normal text-slate-500">Round {selectedMatch?.round}</div>
          </div>
        </DialogTitle>
        <DialogDescription>
          {selectedMatch?.winner 
            ? `Winner: ${selectedMatch.winner}` 
            : 'Select the winner to advance to the next round'}
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-3">
        <div className={`p-4 rounded-xl border-2 transition-all ${
          selectedMatch?.winner === selectedMatch?.player1 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-slate-200 bg-white'
        }`}>
          <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Player 1</div>
          <div className="text-lg font-bold flex items-center justify-between text-slate-800">
            {selectedMatch?.player1 || 'TBD'}
            {selectedMatch?.winner === selectedMatch?.player1 && (
              <div className="bg-emerald-500 rounded-full p-1.5">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-sm font-bold text-slate-400 px-3 py-1 rounded-full bg-slate-100">VS</div>
        </div>

        <div className={`p-4 rounded-xl border-2 transition-all ${
          selectedMatch?.winner === selectedMatch?.player2 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-slate-200 bg-white'
        }`}>
          <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Player 2</div>
          <div className="text-lg font-bold flex items-center justify-between text-slate-800">
            {selectedMatch?.player2 || 'TBD'}
            {selectedMatch?.winner === selectedMatch?.player2 && (
              <div className="bg-emerald-500 rounded-full p-1.5">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-col gap-3">
        {currentClub ? (
          <div className="flex gap-2 w-full">
            <Button 
              className="flex-1 rounded-lg font-semibold border-1"
              disabled={!selectedMatch?.player1}
              onClick={() => handleWin(selectedMatch!.player1!)}
              variant={selectedMatch?.winner === selectedMatch?.player1 ? "default" : "outline"}
            >
              {selectedMatch?.player1 || 'No Player'} Wins
            </Button>
            <Button 
              className="flex-1 rounded-lg font-semibold border-1"
              disabled={!selectedMatch?.player2}
              onClick={() => handleWin(selectedMatch!.player2!)}
              variant={selectedMatch?.winner === selectedMatch?.player2 ? "default" : "outline"}
            >
              {selectedMatch?.player2 || 'No Player'} Wins
            </Button>
          </div>
        ) : (
          <div className="text-sm text-center text-slate-500 py-2 bg-slate-50 rounded-lg border-2 border-slate-100">
            Only club accounts can assign winners
          </div>
        )}
        <Button onClick={() => setOpen(false)} variant="ghost" className="w-full rounded-lg">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);