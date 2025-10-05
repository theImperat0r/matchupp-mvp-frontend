import React, { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, Maximize2, Check, X, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  return (
    <div 
      className={`cursor-pointer transition-all duration-200 ${isCompact ? 'w-52' : 'w-64'}`}
      onClick={() => onClick(match)}
    >
      <Card className={`border-2 transition-all ${
        isFinished ? 'border-green-500/30 bg-green-50/30' : 'border-gray-200 hover:border-blue-400 hover:shadow-lg'
      }`}>
        <CardContent className="p-3">
          {/* Match Header */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-semibold text-gray-500">
              Match #{match.matchNumber}
            </div>
            <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              R{match.round}
            </div>
          </div>

          {/* Player 1 */}
          <div className={`p-2.5 rounded-lg mb-1.5 transition-all ${
            player1Won 
              ? 'bg-green-500 text-white font-bold shadow-md' 
              : isFinished 
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-50 hover:bg-blue-50'
          } ${highlightName === match.player1 ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm truncate flex-1">
                {match.player1 || 'TBD'}
              </span>
              {player1Won && <Check className="w-4 h-4 ml-2" />}
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-xs text-center text-gray-400 font-medium py-0.5">
            VS
          </div>

          {/* Player 2 */}
          <div className={`p-2.5 rounded-lg mt-1.5 transition-all ${
            player2Won 
              ? 'bg-green-500 text-white font-bold shadow-md' 
              : isFinished 
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-50 hover:bg-blue-50'
          } ${highlightName === match.player2 ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm truncate flex-1">
                {match.player2 || 'TBD'}
              </span>
              {player2Won && <Check className="w-4 h-4 ml-2" />}
            </div>
          </div>

          {/* Score if available */}
          {match.score && (
            <div className="text-xs text-center text-gray-500 mt-2">
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
    <div className="text-center mb-4 sticky top-0 bg-white/95 backdrop-blur py-2 z-10">
      <div className="text-sm font-bold text-gray-700 uppercase tracking-wider px-4 py-1.5 rounded-full bg-blue-100">
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
  const transformRef = useRef<any>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Trophy className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg">No bracket available yet</p>
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
      <div className="w-full">
        {/* Mobile Controls */}
        <div className="flex items-center justify-between mb-4 px-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={goToPrevRound}
            disabled={currentRound === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <div className="text-xs text-gray-500">Round {currentRound} of {rounds}</div>
            <div className="font-bold text-gray-700">
              {formatRoundLabel(currentRound, rounds)}
            </div>
          </div>

          <Button 
            size="sm" 
            variant="outline"
            onClick={goToNextRound}
            disabled={currentRound === rounds}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Bracket View */}
        <div className="overflow-x-auto pb-4">
          <div className="flex flex-col gap-4 px-2">
            {matchesByRound[currentRound]?.map((m: Match) => (
              <MatchCard 
                key={m.id} 
                match={m} 
                onClick={openMatch} 
                highlightName={highlightName}
              />
            ))}
          </div>
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
            <div className="flex gap-2 mb-4 items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => zoomIn()} className="gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom In
                </Button>
                <Button size="sm" variant="outline" onClick={() => zoomOut()} className="gap-2">
                  <ZoomOut className="w-4 h-4" />
                  Zoom Out
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resetTransform()} className="gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Reset
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Double-click to zoom • Drag to pan
              </div>
            </div>

            {/* Bracket Container */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-inner">
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
                            <svg width="40" height="100%" className="text-gray-300">
                              <line x1="0" y1="50%" x2="40" y2="50%" stroke="currentColor" strokeWidth="2" />
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
          <Trophy className="w-5 h-5 text-yellow-500" />
          Match #{selectedMatch?.matchNumber} - Round {selectedMatch?.round}
        </DialogTitle>
        <DialogDescription>
          {selectedMatch?.winner 
            ? `Winner: ${selectedMatch.winner}` 
            : 'Select the winner to advance to the next round'}
        </DialogDescription>
      </DialogHeader>

      <div className="py-6 space-y-4">
        <div className={`p-4 rounded-lg border-2 transition-all ${
          selectedMatch?.winner === selectedMatch?.player1 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="text-xs text-gray-500 mb-1">Player 1</div>
          <div className="text-xl font-bold flex items-center justify-between">
            {selectedMatch?.player1 || 'TBD'}
            {selectedMatch?.winner === selectedMatch?.player1 && (
              <Check className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>

        <div className="text-center text-sm font-medium text-gray-400">VS</div>

        <div className={`p-4 rounded-lg border-2 transition-all ${
          selectedMatch?.winner === selectedMatch?.player2 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="text-xs text-gray-500 mb-1">Player 2</div>
          <div className="text-xl font-bold flex items-center justify-between">
            {selectedMatch?.player2 || 'TBD'}
            {selectedMatch?.winner === selectedMatch?.player2 && (
              <Check className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-col gap-3">
        {currentClub ? (
          <div className="flex gap-2 w-full">
            <Button 
              className="flex-1"
              disabled={!selectedMatch?.player1}
              onClick={() => handleWin(selectedMatch!.player1!)}
              variant={selectedMatch?.winner === selectedMatch?.player1 ? "default" : "outline"}
            >
              {selectedMatch?.player1 || 'No Player'} Wins
            </Button>
            <Button 
              className="flex-1"
              disabled={!selectedMatch?.player2}
              onClick={() => handleWin(selectedMatch!.player2!)}
              variant={selectedMatch?.winner === selectedMatch?.player2 ? "default" : "outline"}
            >
              {selectedMatch?.player2 || 'No Player'} Wins
            </Button>
          </div>
        ) : (
          <div className="text-sm text-center text-gray-500 py-2">
            Only club accounts can assign winners
          </div>
        )}
        <Button onClick={() => setOpen(false)} variant="ghost" className="w-full">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);