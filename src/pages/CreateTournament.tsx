import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { useTournament } from '@/contexts/TournamentContext';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

const CreateTournament = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [createdTournament, setCreatedTournament] = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { createTournament, currentClub } = useTournament();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !date || !maxParticipants) {
      toast.error('Please fill all fields');
      return;
    }

    const tournament = await createTournament({
      name,
      description,
      date,
      maxParticipants: parseInt(maxParticipants),
      clubId: currentClub!.id,
    });

    setCreatedTournament({ id: tournament.id, name: tournament.name });
    toast.success('Tournament created successfully!');
  };

  const joinUrl = createdTournament 
    ? `${window.location.origin}/join/${createdTournament.id}`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (createdTournament) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Tournament Created!</CardTitle>
              <CardDescription>
                Share this QR code or link with players to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-4">{createdTournament.name}</h3>
                <div className="flex justify-center mb-6">
                  <div className="bg-card p-6 rounded-lg border-2 border-border">
                    <QRCodeSVG value={joinUrl} size={200} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Join Link</Label>
                <div className="flex gap-2">
                  <Input value={joinUrl} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBackToDashboard} className="flex-1">
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/tournament/${createdTournament.id}`)}
                  className="flex-1"
                >
                  Manage Tournament
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Tournament</CardTitle>
            <CardDescription>
              Set up your tournament details and generate a join link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Championship 2024"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the tournament..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Max Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="2"
                    max="64"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Tournament & Generate QR Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateTournament;
