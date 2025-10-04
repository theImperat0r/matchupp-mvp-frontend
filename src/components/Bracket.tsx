import React, { useState, useRef, useLayoutEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Match } from '@/contexts/TournamentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

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

const RoundRow = ({ title, matches, onClickMatch, registerRef }: any) => (
  <div className="flex flex-col gap-2 w-full">
    <div className="text-left text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</div>
    <div className="flex gap-6 justify-center flex-wrap">
      {matches.map((m: Match) => (
        <div key={m.id} ref={(el) => registerRef(m.id, el)} className="cursor-pointer" onClick={() => onClickMatch(m)}>
          <Card className={`border ${m.winner ? 'bg-muted/5' : 'hover:shadow-lg'}`}>
            <CardContent className="p-3 w-[220px]">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-muted-foreground">Match #{m.matchNumber}</div>
                <div className="text-xs text-muted-foreground">R{m.round}</div>
              </div>
              <div className={`p-2 rounded ${m.winner === m.player1 ? 'bg-primary text-primary-foreground font-bold' : ''}`}>
                <div className="text-sm truncate">{m.player1 || 'TBD'}</div>
              </div>
              <div className="text-xs text-center text-muted-foreground py-1">VS</div>
              <div className={`p-2 rounded ${m.winner === m.player2 ? 'bg-primary text-primary-foreground font-bold' : ''}`}>
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const matchRefs = useRef<Record<string, HTMLElement | null>>({});
  const [connectors, setConnectors] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!matches || matches.length === 0) return <div className="py-12 text-muted-foreground text-center">No bracket available yet</div>;

  const rounds = Math.max(...matches.map(m => m.round));
  const matchesByRound: { [key: number]: Match[] } = {};
  for (let i = 1; i <= rounds; i++) matchesByRound[i] = matches.filter(m => m.round === i);

  const openMatch = (m: Match) => {
    setSelectedMatch(m);
    setOpen(true);
  };

  const registerRef = (id: string, el: HTMLElement | null) => {
    matchRefs.current[id] = el;
  };

  // compute connectors between rounds: for each match in round r, connect to its target in r+1
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const newConnectors: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (let r = 1; r < rounds; r++) {
      const srcMatches = matchesByRound[r] || [];
      const tgtMatches = matchesByRound[r + 1] || [];
      srcMatches.forEach((m) => {
        const srcEl = matchRefs.current[m.id];
        if (!srcEl) return;
        // target index mapping: integer division
        const tgtIndex = Math.floor((m.matchNumber - 1) / 2);
        const tgt = tgtMatches[tgtIndex];
        if (!tgt) return;
        const tgtEl = matchRefs.current[tgt.id];
        if (!tgtEl) return;
        const s = srcEl.getBoundingClientRect();
        const t = tgtEl.getBoundingClientRect();
        const x1 = s.left + s.width / 2 - containerRect.left;
        const y1 = s.top + s.height - containerRect.top; // bottom center
        const x2 = t.left + t.width / 2 - containerRect.left;
        const y2 = t.top - containerRect.top; // top center
        newConnectors.push({ x1, y1, x2, y2 });
      });
    }

    setConnectors(newConnectors);
    // recompute on resize
    const onResize = () => {
      // small debounce
      window.requestAnimationFrame(() => {
        const nc: typeof newConnectors = [];
        for (let r = 1; r < rounds; r++) {
          const srcMatches = matchesByRound[r] || [];
          const tgtMatches = matchesByRound[r + 1] || [];
          srcMatches.forEach((m) => {
            const srcEl = matchRefs.current[m.id];
            if (!srcEl) return;
            const tgtIndex = Math.floor((m.matchNumber - 1) / 2);
            const tgt = tgtMatches[tgtIndex];
            if (!tgt) return;
            const tgtEl = matchRefs.current[tgt.id];
            if (!tgtEl) return;
            const s = srcEl.getBoundingClientRect();
            const t = tgtEl.getBoundingClientRect();
            const x1 = s.left + s.width / 2 - containerRect.left;
            const y1 = s.top + s.height - containerRect.top;
            const x2 = t.left + t.width / 2 - containerRect.left;
            const y2 = t.top - containerRect.top;
            nc.push({ x1, y1, x2, y2 });
          });
        }
        setConnectors(nc);
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [matches, rounds]);

  const handleWin = (winner: string) => {
    if (!selectedMatch) return;
    onWinnerSelect?.(selectedMatch.id, winner);
    setOpen(false);
    setSelectedMatch(null);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current as any;
    if (!el) return;
    try {
      if (!isFullscreen) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggling failed', e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { /* zoom handled inside */ }}>Controls</Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</Button>
        </div>
      </div>

      <TransformWrapper initialScale={0.95} minScale={0.4} maxScale={2} centerOnInit>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div>
            <div className="flex gap-2 mb-2">
              <Button size="sm" onClick={() => zoomIn()}>Zoom In</Button>
              <Button size="sm" variant="outline" onClick={() => zoomOut()}>Zoom Out</Button>
              <Button size="sm" variant="ghost" onClick={() => resetTransform()}>Reset</Button>
            </div>

            <div ref={containerRef} className="relative border rounded overflow-auto max-h-[70vh] p-4 bg-background">
              {/* SVG connectors overlay */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                {connectors.map((c, idx) => (
                  <path key={idx} d={`M ${c.x1} ${c.y1} C ${c.x1} ${(c.y1 + c.y2) / 2} ${c.x2} ${(c.y1 + c.y2) / 2} ${c.x2} ${c.y2}`} stroke="#94a3b8" strokeWidth={2} fill="none" strokeLinecap="round" />
                ))}
              </svg>

              <TransformComponent>
                <div className="flex flex-col gap-8 items-center min-w-full">
                  {Object.entries(matchesByRound).map(([round, roundMatches]) => (
                    <div key={round} className="w-full">
                      <RoundRow title={formatRoundLabel(Number(round), rounds)} matches={roundMatches} onClickMatch={openMatch} registerRef={registerRef} />
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
            <div className="flex gap-2">
              <Button onClick={() => setOpen(false)} variant="outline">Cancel</Button>
              <Button disabled={!selectedMatch?.player1} onClick={() => handleWin(selectedMatch!.player1!)}>{selectedMatch?.player1 ? `Give Win to ${selectedMatch.player1}` : 'No Player'}</Button>
              <Button disabled={!selectedMatch?.player2} onClick={() => handleWin(selectedMatch!.player2!)}>{selectedMatch?.player2 ? `Give Win to ${selectedMatch.player2}` : 'No Player'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
