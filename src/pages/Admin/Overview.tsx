import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AdminOverview = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">User Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage users, KYC status, and account verification
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Bet Management</h3>
            <p className="text-sm text-muted-foreground">
              View all bets, resolve disputes, manual resolutions
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Financials</h3>
            <p className="text-sm text-muted-foreground">
              Platform fees, payouts, reconciliation, analytics
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Dispute Queue</h3>
            <p className="text-sm text-muted-foreground">
              Review and resolve pending bet disputes
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">REF AI Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Monitor REF AI decisions and confidence scores
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Game Rules</h3>
            <p className="text-sm text-muted-foreground">
              Manage game rule templates and categories
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
