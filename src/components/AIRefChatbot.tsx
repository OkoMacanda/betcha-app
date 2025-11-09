import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import gameRulesData from '@/data/gameRules.json';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIRefChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi! I'm REF AI, your personal challenge assistant. I can help you with:\n\n• Understanding game rules\n• Creating challenges\n• Resolving disputes\n• Explaining how Betcha works\n• Payment and wallet questions\n\nWhat can I help you with today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate context from game rules and app info
  const generateContext = () => {
    const gameRulesContext = gameRulesData
      .map((rule) => `${rule.name} (${rule.category}): ${rule.description}. Duration: ${rule.typical_duration}.`)
      .join('\n');

    return `You are REF AI, the official AI referee and assistant for Betcha, a competitive challenge platform. You help users understand game rules, create challenges, resolve disputes, and navigate the platform.

GAME RULES DATABASE:
${gameRulesContext}

PLATFORM INFORMATION:
- Betcha is a secure challenge platform where users can compete in various games and sports
- Currency: South African Rands (R)
- Features: Secure escrow, AI refereeing (that's you!), instant payouts, live score tracking
- Users can create 1v1 challenges, group challenges, team challenges, and tournaments
- 10% platform fee applies to winnings
- Payment provider: Yoco (for South African users)
- Funds are held in secure escrow until challenge concludes
- Users need to verify their identity (KYC) for withdrawals

URL STRUCTURE:
- /games - Browse game rules
- /create-challenge - Create a new challenge
- /active-challenges - View active challenges
- /wallet - Manage funds
- /contacts - Manage contacts
- /groups - Create and join groups

Be helpful, friendly, and concise. When users ask about game rules, provide specific information. When they ask about disputes, guide them through the process. Always maintain a professional but approachable tone.`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response (you'll need to replace this with actual API call)
      // For now, providing intelligent rule-based responses
      const response = await generateAIResponse(input, messages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Intelligent response generator (mock - replace with actual API)
  const generateAIResponse = async (userInput: string, history: Message[]): Promise<string> => {
    const input = userInput.toLowerCase();

    // Game rules queries
    if (input.includes('game') || input.includes('rule') || input.includes('how to play')) {
      const matchedGames = gameRulesData.filter(
        (rule) =>
          rule.name.toLowerCase().includes(input) ||
          rule.category.toLowerCase().includes(input) ||
          input.includes(rule.name.toLowerCase())
      );

      if (matchedGames.length > 0) {
        const game = matchedGames[0];
        return `**${game.name}**\n\n${game.description}\n\n**Duration:** ${game.typical_duration}\n**Difficulty:** ${game.difficulty}\n**Evidence Required:** ${game.evidence_required.join(', ')}\n\nWould you like to create a challenge for this game? Just click "Create Challenge" and select ${game.name}!`;
      }

      return `I can help you with game rules! We have 100+ games including:\n\n• **Sports**: Basketball, Soccer, Tennis, Running races\n• **Board Games**: Chess, Checkers, Scrabble\n• **Physical Challenges**: Push-ups, Planks, Burpees\n• **Mental Games**: Trivia, Memory games, Puzzles\n\nWhich type of game interests you?`;
    }

    // Challenge creation
    if (input.includes('create') || input.includes('start') || input.includes('new challenge')) {
      return `To create a challenge:\n\n1. Click "Create Challenge" in the navigation\n2. Choose a game from our library or create a custom one\n3. Set the challenge amount (in Rands)\n4. Invite your opponent by email\n5. Both players lock in funds - they're held safely in escrow\n6. Play your game!\n7. Winner gets paid automatically (minus 10% platform fee)\n\nNeed help with a specific game? Just ask!`;
    }

    // Payment/Wallet queries
    if (input.includes('payment') || input.includes('deposit') || input.includes('withdraw') || input.includes('wallet')) {
      return `**Payment & Wallet Info:**\n\n💰 **Currency:** South African Rands (R)\n💳 **Payment Provider:** Yoco\n🔒 **Escrow:** Your funds are secure until challenge ends\n📤 **Withdrawals:** Available anytime (KYC required)\n💸 **Fees:** 10% platform fee on winnings\n\nTo manage your wallet, click "Wallet" in the menu. Need help with a deposit or withdrawal?`;
    }

    // Dispute resolution
    if (input.includes('dispute') || input.includes('disagree') || input.includes('unfair') || input.includes('cheat')) {
      return `**Dispute Resolution Process:**\n\n1. Go to your challenge details page\n2. Click on the "Disputes" tab\n3. Provide evidence (video, screenshots, score sheets)\n4. I'll review the evidence and make a fair decision\n5. Resolution typically takes 24-48 hours\n\nRemember: Always submit clear evidence! Video proof is the strongest form of evidence. 📹`;
    }

    // How Betcha works
    if (input.includes('how') || input.includes('work') || input.includes('what is')) {
      return `**How Betcha Works:**\n\n1️⃣ **Create a Challenge** - Pick a game and set stakes\n2️⃣ **Lock Funds** - Both players deposit money (held in secure escrow)\n3️⃣ **Play & Track** - Use live score tracking or submit evidence\n4️⃣ **Win & Get Paid** - Winner gets payout automatically!\n\n✨ **Key Features:**\n• 100+ pre-built game rules\n• Secure escrow system\n• AI refereeing (that's me!)\n• Live score tracking\n• Instant payouts\n\nWhat would you like to know more about?`;
    }

    // Group/Team challenges
    if (input.includes('group') || input.includes('team') || input.includes('tournament') || input.includes('multiple')) {
      return `**Group & Team Challenges:**\n\n🎯 **Group Individual** - Multiple players compete individually\n👥 **Team vs Team** - Form teams and compete together\n🏆 **Tournament** - Multi-round elimination format\n\n**Prize Distribution:**\n• 2 teams: Winner takes all\n• 3+ teams: 50% 1st, 35% 2nd, 15% 3rd\n\nCreate your group challenge from "Create Challenge" and invite participants!`;
    }

    // Live tracking
    if (input.includes('live') || input.includes('score') || input.includes('track') || input.includes('real-time')) {
      return `**Live Score Tracking:**\n\n📊 Enable real-time score updates for active challenges!\n\n**How it works:**\n1. Start your challenge\n2. Enable live tracking (both players must agree)\n3. One player becomes team captain\n4. Update scores in real-time during gameplay\n5. REF AI monitors for suspicious activity\n\nThis feature is great for longer games like sports matches! Want to enable it for your challenge?`;
    }

    // Contact/Support
    if (input.includes('contact') || input.includes('help') || input.includes('support') || input.includes('problem')) {
      return `I'm here to help! 😊\n\nYou can:\n• Ask me about any game rules\n• Get help creating challenges\n• Learn about payments and withdrawals\n• Resolve disputes\n• Navigate the platform\n\nFor technical issues, check your browser console or contact support. What specific issue are you facing?`;
    }

    // Default response
    return `I'm here to help with Betcha! I can assist you with:\n\n• 🎮 Game rules and how to play\n• ⚔️ Creating challenges\n• 💰 Payments, deposits, and withdrawals\n• ⚖️ Dispute resolution\n• 📊 Live score tracking\n• 👥 Group and team challenges\n\nWhat would you like to know?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-primary hover:scale-110 transition-all z-50 glow-primary"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 border-primary/20">
      <CardHeader className="bg-gradient-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">REF AI</CardTitle>
            <Badge variant="secondary" className="text-xs mt-1">
              Online
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask REF AI anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            REF AI can help with rules, challenges, and disputes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRefChatbot;
