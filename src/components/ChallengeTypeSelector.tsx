import { Users, UserCheck, Trophy, Swords } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChallengeType } from '@/types/social.types';

interface ChallengeTypeSelectorProps {
  selected: ChallengeType;
  onChange: (type: ChallengeType) => void;
}

export default function ChallengeTypeSelector({ selected, onChange }: ChallengeTypeSelectorProps) {
  const types: Array<{
    value: ChallengeType;
    icon: React.ReactNode;
    title: string;
    description: string;
    prizes?: string;
  }> = [
    {
      value: 'one_on_one',
      icon: <Swords className="h-6 w-6" />,
      title: 'One-on-One',
      description: 'Classic head-to-head challenge',
      prizes: 'Winner takes all',
    },
    {
      value: 'group_individual',
      icon: <Users className="h-6 w-6" />,
      title: 'Group Challenge',
      description: 'Everyone competes individually',
      prizes: '1st: 50%, 2nd: 35%, 3rd: 15%',
    },
    {
      value: 'team_vs_team',
      icon: <UserCheck className="h-6 w-6" />,
      title: 'Team vs Team',
      description: 'Create teams and compete',
      prizes: 'Winning team splits pot',
    },
    {
      value: 'tournament',
      icon: <Trophy className="h-6 w-6" />,
      title: 'Tournament',
      description: '3+ teams compete for prizes',
      prizes: '1st: 50%, 2nd: 35%, 3rd: 15%',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Challenge Type</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to compete
        </p>
      </div>

      <RadioGroup value={selected} onValueChange={(value) => onChange(value as ChallengeType)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map((type) => (
            <div key={type.value} className="relative">
              <RadioGroupItem
                value={type.value}
                id={type.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={type.value}
                className="flex flex-col cursor-pointer"
              >
                <Card className={`cursor-pointer transition-all ${
                  selected === type.value
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'hover:border-primary/50'
                }`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        selected === type.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10'
                      }`}>
                        {type.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{type.title}</CardTitle>
                        <CardDescription className="text-xs">{type.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {type.prizes && (
                    <CardContent>
                      <div className="rounded-md bg-muted p-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Prize Split
                        </p>
                        <p className="text-sm font-semibold">{type.prizes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      <div className="rounded-lg bg-primary/10 border border-primary/30 p-3">
        <p className="text-sm text-primary">
          <strong>Platform Fee:</strong> 10% deducted from prize pool for all challenge types
        </p>
      </div>
    </div>
  );
}
