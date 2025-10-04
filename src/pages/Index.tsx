import { Navigate } from 'react-router-dom';
import { useTournament } from '@/contexts/TournamentContext';

const Index = () => {
  const { currentClub } = useTournament();

  if (currentClub) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/auth" replace />;
};

export default Index;
