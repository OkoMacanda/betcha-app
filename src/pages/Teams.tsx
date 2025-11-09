import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";

const Teams = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Teams & Groups</h1>

        <Card className="p-8">
          <p className="text-muted-foreground">
            Team features coming soon. This will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Create and join teams</li>
            <li>Team vs team bets</li>
            <li>Team wallets</li>
            <li>Team leaderboards</li>
            <li>Tournament brackets</li>
          </ul>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Teams;
