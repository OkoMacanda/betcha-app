import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Shield, Users, Sparkles, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageSEO({ title: "Betcha – Secure Social Betting App", description: "Browse 100+ game rules or create custom bets. Secure escrow, AI refereeing, instant payouts.", canonicalPath: "/" });

  const gameCategories = [
    { name: "Sports", icon: Trophy, count: 35 },
    { name: "Board Games", icon: Sparkles, count: 28 },
    { name: "Word Games", icon: Zap, count: 18 },
    { name: "Custom Bets", icon: Users, count: "∞" }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Escrow",
      description: "Your bets are locked in safely. Winners get paid automatically."
    },
    {
      icon: Zap,
      title: "AI Referee",
      description: "REF AI tracks progress and resolves disputes fairly."
    },
    {
      icon: Users,
      title: "Community Bets",
      description: "Team competitions, club events, and group challenges."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Navigation />

      {/* Hero Section */}
      <section className="gradient-hero py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          {/* GIGANTIC HERO LOGO - DOMINATES THE PAGE */}
          <div className="flex justify-center mb-12">
            <img
              src="/logo.png"
              alt="Betcha"
              className="h-80 md:h-96 lg:h-[32rem] w-auto object-contain logo-hero"
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Secure • Fair • Instant Payouts</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Lock In Your Bets.
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Back Up Your Words.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            "I bet I can beat you!" Now there's an app for that. Betcha makes competitive 
            projections real with secure escrow, AI refereeing, and instant payouts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              className="text-lg"
              onClick={() => navigate(user ? "/active-bets" : "/signup")}
            >
              <Play className="w-5 h-5 mr-2" />
              {user ? "Go to Dashboard" : "Get Started"}
            </Button>
            <Button variant="outline" size="lg" className="text-lg" onClick={() => navigate("/games")}>
              Browse Games
            </Button>
          </div>
        </div>
      </section>

      {/* Game Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            100+ Pre-Built Game Rules
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameCategories.map((category) => (
              <Card
                key={category.name}
                className="p-6 hover:border-primary transition-smooth cursor-pointer group"
                onClick={() => navigate("/games")}
              >
                <category.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-smooth" />
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-muted-foreground">{category.count} games available</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Betcha Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center glow-primary">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Put Your Money Where Your Mouth Is?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands backing up their competitive projections with real stakes.
          </p>
          <Button variant="hero" size="lg" className="text-lg" onClick={() => navigate("/games")}>
            Get Started - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Betcha. Lock in your bets. Back up your words.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
