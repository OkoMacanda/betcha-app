import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, User, Crown, Settings, Trash2, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGroups, createGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember } from '@/lib/api/groups.api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import ContactsPicker from '@/components/ContactsPicker';

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => getGroups(user!.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createGroup(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Group created successfully!' });
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: string) => deleteGroup(groupId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Group deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: async ({ groupId, contactIds }: { groupId: string; contactIds: string[] }) => {
      const promises = contactIds.map((contactId) =>
        addGroupMember(groupId, contactId, user!.id)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Members added successfully!' });
      setShowAddMembersModal(false);
      setSelectedContactIds([]);
      setSelectedGroupId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add members',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      removeGroupMember(groupId, memberId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Member removed' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: 'Group name required',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      name: groupName,
      description: groupDescription || undefined,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      deleteMutation.mutate(groupId);
    }
  };

  const handleAddMembers = () => {
    if (!selectedGroupId || selectedContactIds.length === 0) return;

    addMembersMutation.mutate({
      groupId: selectedGroupId,
      contactIds: selectedContactIds,
    });
  };

  const handleRemoveMember = (groupId: string, memberId: string) => {
    if (confirm('Remove this member from the group?')) {
      removeMemberMutation.mutate({ groupId, memberId });
    }
  };

  const handleGroupChallenge = (groupId: string) => {
    navigate(`/create-bet?groupId=${groupId}`);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Friend Groups</h1>
            <p className="text-muted-foreground">
              Create groups to organize and challenge your friends
            </p>
          </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading groups...
        </div>
      ) : groups?.data?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-medium mb-2">No groups yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first group to organize friends and set up group challenges
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups?.data?.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {group.name}
                      {group.owner_id === user?.id && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  {group.owner_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      Members ({group.member_count || 0})
                    </p>
                    {group.owner_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setShowAddMembersModal(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.members?.slice(0, 6).map((member) => (
                      <div
                        key={member.id}
                        className="relative group"
                      >
                        <Avatar className="h-8 w-8 border-2 border-background">
                          {member.profile?.avatar_url ? (
                            <AvatarImage src={member.profile.avatar_url} />
                          ) : null}
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        {group.owner_id === user?.id && member.contact_id !== user.id && (
                          <button
                            onClick={() => handleRemoveMember(group.id, member.id)}
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <UserMinus className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {(group.member_count || 0) > 6 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        +{(group.member_count || 0) - 6}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGroupChallenge(group.id)}
                  >
                    Create Challenge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/groups/${group.id}/leaderboard`)}
                  >
                    Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to organize your friends and set up group challenges
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g., College Friends, Basketball Crew"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this group about?"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Members Modal */}
      <Dialog open={showAddMembersModal} onOpenChange={setShowAddMembersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
            <DialogDescription>
              Select contacts to add to this group
            </DialogDescription>
          </DialogHeader>

          <ContactsPicker
            selectedIds={selectedContactIds}
            onSelect={setSelectedContactIds}
            multiSelect={true}
            filterPlatformUsersOnly={true}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMembersModal(false);
                setSelectedContactIds([]);
                setSelectedGroupId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedContactIds.length === 0 || addMembersMutation.isPending}
            >
              {addMembersMutation.isPending
                ? 'Adding...'
                : `Add ${selectedContactIds.length} Member(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
