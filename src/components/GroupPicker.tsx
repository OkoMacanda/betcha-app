import { useState } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getGroups } from '@/lib/api/groups.api';

interface GroupPickerProps {
  selectedGroupIds: string[];
  onSelect: (groupIds: string[]) => void;
  multiSelect?: boolean;
}

export default function GroupPicker({
  selectedGroupIds,
  onSelect,
  multiSelect = false,
}: GroupPickerProps) {
  const { user } = useAuth();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await getGroups(user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const handleToggle = (groupId: string) => {
    if (multiSelect) {
      const isSelected = selectedGroupIds.includes(groupId);
      if (isSelected) {
        onSelect(selectedGroupIds.filter((id) => id !== groupId));
      } else {
        onSelect([...selectedGroupIds, groupId]);
      }
    } else {
      onSelect([groupId]);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading groups...</div>;
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No groups yet</p>
        <p className="text-sm">Create a group to invite multiple people at once</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] border rounded-lg p-2">
      <div className="space-y-2">
        {groups.map((group) => {
          const isSelected = selectedGroupIds.includes(group.id);

          return (
            <div
              key={group.id}
              onClick={() => handleToggle(group.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted border border-transparent'
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{group.name}</p>
                <p className="text-sm text-muted-foreground">
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                </p>
              </div>

              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
