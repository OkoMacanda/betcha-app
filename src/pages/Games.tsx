import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Search, Users, Target, Dumbbell, Gamepad2, MessageSquare, Brain, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import Navigation from "@/components/Navigation";
import gameRulesData from "@/data/gameRules.json";

interface GameRule {
  id: string;
  name: string;
  category: string;
  description: string;
  win_condition: {
    type: string;
    params: Record<string, any>;
  };
  evidence_required: string[];
  typical_duration?: string;
  difficulty?: string;
  popularity?: number;
}

const Games = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [gameRules, setGameRules] = useState<GameRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<GameRule[]>([]);

  usePageSEO({ title: "Browse Game Rules – Betcha", description: "Search 100+ pre-built game rules or create your own custom bet.", canonicalPath: "/games" });

  // Load game rules on mount
  useEffect(() => {
    const rules = gameRulesData as GameRule[];
    setGameRules(rules);
    setFilteredRules(rules);
  }, []);

  // Filter rules based on search and category
  useEffect(() => {
    let filtered = gameRules;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(rule => rule.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRules(filtered);
  }, [searchQuery, selectedCategory, gameRules]);

  // Category icon and color mapping
  const categoryConfig: Record<string, { icon: any; color: string; displayName: string }> = {
    sports: { icon: Trophy, color: "text-accent", displayName: "Sports" },
    physical_challenges: { icon: Dumbbell, color: "text-destructive", displayName: "Physical Challenges" },
    board_games: { icon: Gamepad2, color: "text-primary", displayName: "Board Games" },
    card_games: { icon: Gamepad2, color: "text-primary", displayName: "Card Games" },
    word_games: { icon: MessageSquare, color: "text-accent", displayName: "Word Games" },
    video_games: { icon: Gamepad2, color: "text-primary-glow", displayName: "Video Games" },
    spoken_word: { icon: MessageSquare, color: "text-accent", displayName: "Spoken Word" },
    skill_challenges: { icon: Target, color: "text-primary-glow", displayName: "Skill Challenges" },
    mental_games: { icon: Brain, color: "text-accent", displayName: "Mental Games" },
  };

  // Group filtered rules by category
  const groupedRules = filteredRules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, GameRule[]>);

  // Create category list for rendering
  const categoriesToDisplay = Object.entries(groupedRules).map(([categoryId, rules]) => ({
    id: categoryId,
    name: categoryConfig[categoryId]?.displayName || categoryId,
    icon: categoryConfig[categoryId]?.icon || Trophy,
    color: categoryConfig[categoryId]?.color || "text-accent",
    games: rules,
  }));

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Browse Game Rules</h1>
          <p className="text-muted-foreground mb-6">
            Choose from {gameRules.length}+ pre-built game rules or create your own custom bet
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="board_games">Board Games</SelectItem>
                <SelectItem value="card_games">Card Games</SelectItem>
                <SelectItem value="word_games">Word Games</SelectItem>
                <SelectItem value="video_games">Video Games</SelectItem>
                <SelectItem value="physical_challenges">Physical Challenges</SelectItem>
                <SelectItem value="spoken_word">Spoken Word</SelectItem>
                <SelectItem value="skill_challenges">Skill Challenges</SelectItem>
                <SelectItem value="mental_games">Mental Games</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="hero" onClick={() => navigate("/create-bet")}>
              Create Custom Bet
            </Button>
          </div>
        </div>

        {/* Game Categories */}
        <div className="space-y-12">
          {categoriesToDisplay.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-6">
                <category.icon className={`w-8 h-8 ${category.color}`} />
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <Badge variant="secondary">{category.games.length} games</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.games.map((rule) => (
                  <Card
                    key={rule.id}
                    className="p-6 hover:border-primary transition-smooth cursor-pointer group"
                    onClick={() => navigate("/create-bet", { state: { gameRule: rule } })}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-smooth">
                        {rule.name}
                      </h3>
                      {rule.popularity && rule.popularity > 70 && (
                        <Badge variant="default" className="bg-gradient-primary">
                          Popular
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {rule.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {rule.typical_duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{rule.typical_duration}</span>
                        </div>
                      )}
                      {rule.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {rule.difficulty}
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-auto group-hover:border-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/create-bet", { state: { gameRule: rule } });
                      }}
                    >
                      Select Game
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {categoriesToDisplay.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No games found matching "{searchQuery}"
              {selectedCategory !== "all" && ` in category "${categoryConfig[selectedCategory]?.displayName || selectedCategory}"`}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
              {selectedCategory !== "all" && (
                <Button variant="link" onClick={() => setSelectedCategory("all")}>
                  Show all categories
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
