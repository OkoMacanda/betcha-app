import { useState, useMemo } from 'react';
import { Search, User, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/useContacts';
import { Contact } from '@/types/social.types';

interface ContactsPickerProps {
  selectedIds: string[];
  onSelect: (contactIds: string[]) => void;
  multiSelect?: boolean;
  filterPlatformUsersOnly?: boolean;
}

export default function ContactsPicker({
  selectedIds,
  onSelect,
  multiSelect = true,
  filterPlatformUsersOnly = false,
}: ContactsPickerProps) {
  const { contacts, isLoading } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    let filtered = contacts || [];

    if (filterPlatformUsersOnly) {
      filtered = filtered.filter((c) => c.linked_user_id);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.contact_name.toLowerCase().includes(query) ||
          c.contact_email?.toLowerCase().includes(query) ||
          c.contact_phone?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [contacts, searchQuery, filterPlatformUsersOnly]);

  const handleToggle = (contact: Contact) => {
    if (multiSelect) {
      const isSelected = selectedIds.includes(contact.linked_user_id || contact.id);
      if (isSelected) {
        onSelect(selectedIds.filter((id) => id !== (contact.linked_user_id || contact.id)));
      } else {
        onSelect([...selectedIds, contact.linked_user_id || contact.id]);
      }
    } else {
      onSelect([contact.linked_user_id || contact.id]);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[300px] border rounded-lg p-2">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No contacts found' : 'No contacts yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.linked_user_id || contact.id);
              const isPlatformUser = !!contact.linked_user_id;

              return (
                <div
                  key={contact.id}
                  onClick={() => handleToggle(contact)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.contact_avatar_url} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{contact.contact_name}</p>
                      {isPlatformUser && (
                        <Badge variant="secondary" className="text-xs">
                          On Betcha
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.contact_email || contact.contact_phone || 'No contact info'}
                    </p>
                  </div>

                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="text-sm text-muted-foreground">
        {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select contacts'}
      </div>
    </div>
  );
}
