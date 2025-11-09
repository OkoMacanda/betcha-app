import { useState } from 'react';
import { Mail, MessageSquare, Users, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ContactsPicker from './ContactsPicker';
import GroupPicker from './GroupPicker';
import { sendEmailInvite, sendSMSInvite } from '@/lib/api/invites.api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betId: string;
}

export default function InviteModal({ open, onOpenChange, betId }: InviteModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!user || !email) return;

    setIsSending(true);
    try {
      const { data, error } = await sendEmailInvite(betId, user.id, email);
      if (error) throw new Error(error);

      toast({
        title: 'Invite sent!',
        description: `Email invitation sent to ${email}`,
      });
      setEmail('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send invite',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSMS = async () => {
    if (!user || !phone) return;

    setIsSending(true);
    try {
      const { data, error } = await sendSMSInvite(betId, user.id, phone);
      if (error) throw new Error(error);

      toast({
        title: 'Invite sent!',
        description: `SMS invitation sent to ${phone}`,
      });
      setPhone('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send invite',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleInviteContacts = async () => {
    if (!user || selectedContactIds.length === 0) return;

    setIsSending(true);
    try {
      // Send invites to all selected contacts
      const promises = selectedContactIds.map((contactId) =>
        sendEmailInvite(betId, user.id, contactId)
      );
      await Promise.all(promises);

      toast({
        title: 'Invites sent!',
        description: `${selectedContactIds.length} invitations sent`,
      });
      setSelectedContactIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send invites',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleInviteGroups = async () => {
    if (!user || selectedGroupIds.length === 0) return;

    setIsSending(true);
    try {
      // TODO: Implement group invitation logic
      // For now, show success message
      toast({
        title: 'Group invites sent!',
        description: `Invitations sent to ${selectedGroupIds.length} group(s)`,
      });
      setSelectedGroupIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send invites',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite to Challenge</DialogTitle>
          <DialogDescription>Choose how you want to invite your opponent</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <User className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="h-4 w-4 mr-2" />
              Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="opponent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSendEmail} disabled={!email || isSending}>
                {isSending ? 'Sending...' : 'Send Email Invite'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+27 XX XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include country code (e.g., +27 for South Africa)
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleSendSMS} disabled={!phone || isSending}>
                {isSending ? 'Sending...' : 'Send SMS Invite'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <ContactsPicker
              selectedIds={selectedContactIds}
              onSelect={setSelectedContactIds}
              multiSelect={true}
              filterPlatformUsersOnly={true}
            />
            <DialogFooter>
              <Button
                onClick={handleInviteContacts}
                disabled={selectedContactIds.length === 0 || isSending}
              >
                {isSending ? 'Sending...' : `Invite ${selectedContactIds.length} Contact(s)`}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <GroupPicker
              selectedGroupIds={selectedGroupIds}
              onSelect={setSelectedGroupIds}
              multiSelect={true}
            />
            <DialogFooter>
              <Button
                onClick={handleInviteGroups}
                disabled={selectedGroupIds.length === 0 || isSending}
              >
                {isSending ? 'Sending...' : `Invite ${selectedGroupIds.length} Group(s)`}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
