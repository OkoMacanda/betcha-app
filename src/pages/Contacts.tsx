import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search, UserPlus, Users as UsersIcon, Phone, Mail, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ContactsPermission from '@/components/ContactsPermission';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Navigation from '@/components/Navigation';

export default function Contacts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contacts, isLoading, searchContacts, syncContacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      await searchContacts(query);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncContacts();
    setIsSyncing(false);
  };

  const handleQuickChallenge = (contactId: string) => {
    navigate(`/create-bet?contactId=${contactId}`);
  };

  const handleViewHistory = (contactId: string) => {
    const contact = contacts?.find((c) => c.id === contactId);
    if (contact?.linked_user_id) {
      navigate(`/challenge-history?opponentId=${contact.linked_user_id}`);
    }
  };

  const filteredContacts = contacts?.filter((contact) => {
    if (activeTab === 'platform' && !contact.linked_user_id) return false;
    if (activeTab === 'phone' && contact.source !== 'phone') return false;
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      return (
        contact.contact_name.toLowerCase().includes(query) ||
        contact.contact_email?.toLowerCase().includes(query) ||
        contact.contact_phone?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const platformUserCount = contacts?.filter((c) => c.linked_user_id).length || 0;
  const phoneContactCount = contacts?.filter((c) => c.source === 'phone').length || 0;

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and challenge history
          </p>
        </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowImportModal(true)} variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Import Contacts
        </Button>
        <Button onClick={handleSync} disabled={isSyncing} variant="outline">
          <UsersIcon className="h-4 w-4 mr-2" />
          {isSyncing ? 'Syncing...' : 'Sync Platform Users'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">
            All ({contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="platform">
            Platform Users ({platformUserCount})
          </TabsTrigger>
          <TabsTrigger value="phone">
            Phone Contacts ({phoneContactCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading contacts...
            </div>
          ) : filteredContacts?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No contacts yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import your phone contacts to get started
                  </p>
                  <Button onClick={() => setShowImportModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Import Contacts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredContacts?.map((contact) => (
              <Card key={contact.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {contact.profile?.avatar_url ? (
                        <AvatarImage src={contact.profile.avatar_url} />
                      ) : null}
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{contact.contact_name}</p>
                        {contact.linked_user_id && (
                          <Badge variant="secondary" className="text-xs">
                            Platform User
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {contact.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.contact_email}</span>
                          </div>
                        )}
                        {contact.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{contact.contact_phone}</span>
                          </div>
                        )}
                      </div>

                      {contact.total_challenges > 0 && (
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-amber-500" />
                            <span className="text-muted-foreground">
                              {contact.total_challenges} challenges
                            </span>
                          </div>
                          <span className="text-green-600 dark:text-green-400">
                            {contact.wins_against}W
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            {contact.losses_against}L
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {contact.linked_user_id && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickChallenge(contact.id)}
                        >
                          Challenge
                        </Button>
                      )}
                      {contact.total_challenges > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(contact.id)}
                        >
                          View History
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="platform" className="space-y-3">
          {filteredContacts?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No platform users found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sync your contacts to find friends on Betcha
                  </p>
                  <Button onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredContacts?.map((contact) => (
              <Card key={contact.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {contact.profile?.avatar_url ? (
                        <AvatarImage src={contact.profile.avatar_url} />
                      ) : null}
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium mb-1">{contact.contact_name}</p>
                      {contact.total_challenges > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">
                            {contact.total_challenges} challenges
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {contact.wins_against}W
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            {contact.losses_against}L
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleQuickChallenge(contact.id)}
                      >
                        Challenge
                      </Button>
                      {contact.total_challenges > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(contact.id)}
                        >
                          History
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="phone" className="space-y-3">
          {filteredContacts?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No phone contacts imported</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import contacts from your phone to see them here
                  </p>
                  <Button onClick={() => setShowImportModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Import Contacts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredContacts?.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">{contact.contact_name}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        {contact.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{contact.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {contact.linked_user_id && (
                      <Badge variant="secondary">Platform User</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <ContactsPermission />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
