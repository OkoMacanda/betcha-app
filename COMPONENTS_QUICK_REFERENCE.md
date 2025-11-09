# Betcha Components - Quick Reference Guide

## Social/Group Betting Components (Core)

### ContactsPicker Component
```tsx
import ContactsPicker from '@/components/ContactsPicker';

// In your component
<ContactsPicker
  selectedIds={selectedContactIds}
  onSelect={setSelectedContactIds}
  multiSelect={true}
  filterPlatformUsersOnly={false}
/>
```
**Features**: Search, filter, multi-select, platform user badge
**Used in**: InviteModal, Groups.tsx

---

### GroupPicker Component
```tsx
import GroupPicker from '@/components/GroupPicker';

// In your component
<GroupPicker
  selectedGroupIds={selectedGroupIds}
  onSelect={setSelectedGroupIds}
  multiSelect={false}
/>
```
**Features**: Group list, member count, single/multi-select
**Used in**: InviteModal

---

### InviteModal Component
```tsx
import InviteModal from '@/components/InviteModal';

// In your component
const [inviteOpen, setInviteOpen] = useState(false);

<InviteModal
  open={inviteOpen}
  onOpenChange={setInviteOpen}
  betId={currentBetId}
/>
```
**Features**: Email, SMS, contacts, groups tabs
**Used in**: BetDetail.tsx, probably CreateBet.tsx

---

### ContactsPermission Component
```tsx
import ContactsPermission from '@/components/ContactsPermission';

// Shows permission request + import progress
<ContactsPermission />
```
**Features**: Permission request, import progress tracking, success/error states
**Used in**: Contacts.tsx page

---

## Challenge Management Components

### ScoreUpdateModal
```tsx
<ScoreUpdateModal
  open={scoreOpen}
  onOpenChange={setScoreOpen}
  betId={betId}
/>
```
**Purpose**: Update scores during active challenges

---

### ChallengeTypeSelector
```tsx
<ChallengeTypeSelector
  selectedType={challengeType}
  onSelect={setChallengeType}
/>
```
**Purpose**: Choose between 1v1, group, team, tournament

---

### DisputeManager
```tsx
<DisputeManager betId={betId} />
```
**Purpose**: Handle dispute submissions and lifecycle

---

### FloatingScoreWidget
```tsx
<FloatingScoreWidget betId={betId} />
```
**Purpose**: Sticky real-time score display

---

## Type Definitions (Key Types)

### Social Types
```tsx
import { 
  Contact, 
  FriendGroup, 
  ChallengeParticipant,
  HeadToHeadStats,
  ChallengeInvite
} from '@/types/social.types';

// Contact
interface Contact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_email?: string;
  linked_user_id?: string;
  total_challenges: number;
  wins_against: number;
  losses_against: number;
}

// FriendGroup
interface FriendGroup {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  member_count: number;
}
```

---

## Custom Hooks

### useContacts()
```tsx
const { 
  contacts, 
  isLoading, 
  searchContacts, 
  syncContacts, 
  importContacts 
} = useContacts();
```

### useGroupBetting()
```tsx
const { 
  createChallenge, 
  joinChallenge, 
  submitResults 
} = useGroupBetting();
```

### useAuth()
```tsx
const { user, signOut, isLoading } = useAuth();
```

---

## API Functions

### Groups API
```tsx
import { 
  getGroups, 
  createGroup, 
  updateGroup, 
  deleteGroup,
  addGroupMember,
  removeGroupMember 
} from '@/lib/api/groups.api';

// Get all groups
const { data } = await getGroups(userId);

// Create group
const { data } = await createGroup(userId, { 
  name: 'My Group',
  description: 'Optional'
});

// Add member to group
await addGroupMember(groupId, contactId, userId);
```

### Group Betting API
```tsx
import {
  createGroupIndividualChallenge,
  createTeamChallenge,
  createTournamentChallenge,
  joinChallenge,
  submitChallengeResults
} from '@/lib/api/groupBetting.api';

// Create group challenge
const { data } = await createGroupIndividualChallenge(userId, {
  challenge_type: 'group_individual',
  entry_fee: 100,
  prize_distribution: { first: 80, second: 20 },
  game_name: 'FIFA 24'
});

// Join challenge
await joinChallenge(betId, userId, { entry_paid: true });

// Submit results
await submitChallengeResults(betId, userId, {
  rankings: [
    { user_id: 'user1', rank: 1 },
    { user_id: 'user2', rank: 2 }
  ]
});
```

### Invites API
```tsx
import {
  sendEmailInvite,
  sendSMSInvite,
  getInvites,
  respondToInvite
} from '@/lib/api/invites.api';

// Send email invite
await sendEmailInvite(betId, userId, 'email@example.com');

// Send SMS invite
await sendSMSInvite(betId, userId, '+27xxxxxxxxxx');

// Get pending invites
const { data } = await getInvites(userId);

// Respond to invite
await respondToInvite(inviteId, 'accepted');
```

---

## Common Patterns

### Modal with Picker
```tsx
// In page component
const [showModal, setShowModal] = useState(false);
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// JSX
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent>
    <ContactsPicker
      selectedIds={selectedIds}
      onSelect={setSelectedIds}
      multiSelect={true}
    />
    <DialogFooter>
      <Button onClick={handleSubmit}>Invite</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Mutation Pattern
```tsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (data) => myApiFunction(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['myData'] });
    toast({ title: 'Success!' });
  },
  onError: (error) => {
    toast({ 
      title: 'Error', 
      description: error.message,
      variant: 'destructive'
    });
  }
});

return <Button onClick={() => mutation.mutate(data)}>Submit</Button>;
```

---

## UI Components Quick Index

**Dialogs**: dialog, alert-dialog, sheet, drawer
**Forms**: input, textarea, button, checkbox, select, toggle, switch, slider
**Layout**: card, separator, scroll-area, tabs, accordion
**Display**: table, badge, avatar, pagination, carousel
**Navigation**: dropdown-menu, sidebar, navigation-menu, breadcrumb
**Feedback**: alert, progress, skeleton, toast

All from `/src/components/ui/`

---

## File Paths

```
Components:
/src/components/ContactsPicker.tsx
/src/components/GroupPicker.tsx
/src/components/InviteModal.tsx
/src/components/ContactsPermission.tsx
/src/components/ScoreUpdateModal.tsx
/src/components/ChallengeTypeSelector.tsx
/src/components/DisputeManager.tsx
/src/components/FloatingScoreWidget.tsx
/src/components/Navigation.tsx

Pages:
/src/pages/Contacts.tsx
/src/pages/Groups.tsx
/src/pages/CreateBet.tsx
/src/pages/BetDetail.tsx
/src/pages/ChallengeHistory.tsx
/src/pages/ActiveBets.tsx

APIs:
/src/lib/api/groups.api.ts
/src/lib/api/groupBetting.api.ts
/src/lib/api/invites.api.ts
/src/lib/api/contacts.api.ts
/src/lib/api/scores.api.ts
/src/lib/api/disputes.api.ts

Hooks:
/src/hooks/useContacts.ts
/src/hooks/useGroupBetting.ts
/src/hooks/useAuth.ts
/src/hooks/useWallet.ts

Types:
/src/types/social.types.ts
```

---

## Integration Checklist

When adding social/group betting features:

- [ ] Import ContactsPicker for contact selection
- [ ] Import InviteModal for bet invitations
- [ ] Use useContacts() hook to get contact data
- [ ] Use useGroupBetting() for challenge operations
- [ ] Call groupBetting API for creating challenges
- [ ] Call invites API for sending invitations
- [ ] Import relevant types from social.types.ts
- [ ] Handle loading/error states
- [ ] Show toast notifications for user feedback
- [ ] Invalidate React Query after mutations

---

## Common Queries

**Get all contacts**: `useContacts()` hook
**Get all groups**: `getGroups(userId)` API
**Create group challenge**: `createGroupIndividualChallenge()` API
**Send invite**: `sendEmailInvite()` or `sendSMSInvite()` API
**Get challenge participants**: `getChallengeParticipants()` API
**Submit challenge results**: `submitChallengeResults()` API

