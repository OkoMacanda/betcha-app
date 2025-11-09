import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import {
  getContacts,
  importContacts,
  addContact,
  deleteContact,
  searchContacts,
  syncContactsWithPlatformUsers,
} from '@/lib/api/contacts.api';
import { Contact, ImportContactData } from '@/types/social.types';

/**
 * Custom hook for managing contacts
 */
export function useContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  // Fetch contacts
  const {
    data: contacts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getContacts(user.id);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!user,
  });

  // Import contacts mutation
  const importMutation = useMutation({
    mutationFn: async (contactsData: ImportContactData[]) => {
      if (!user) throw new Error('Not authenticated');
      setIsImporting(true);
      const { data, error } = await importContacts(user.id, contactsData);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Contacts imported',
        description: 'Your contacts have been imported successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.id] });
      setIsImporting(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsImporting(false);
    },
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: ImportContactData) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await addContact(user.id, contactData);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Contact added',
        description: 'Contact has been added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await deleteContact(contactId);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Contact deleted',
        description: 'Contact has been removed',
      });
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Search contacts mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await searchContacts(user.id, query);
      if (error) throw new Error(error);
      return data || [];
    },
  });

  // Sync contacts mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await syncContactsWithPlatformUsers(user.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (linkedCount) => {
      if (linkedCount > 0) {
        toast({
          title: 'Contacts synced',
          description: `${linkedCount} contact(s) linked to platform users`,
        });
        queryClient.invalidateQueries({ queryKey: ['contacts', user?.id] });
      }
    },
  });

  return {
    contacts: contacts || [],
    isLoading,
    error,
    isImporting,
    importContacts: importMutation.mutate,
    addContact: addContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    searchContacts: searchMutation.mutateAsync,
    syncContacts: syncMutation.mutate,
    isSearching: searchMutation.isPending,
  };
}

/**
 * Request permission to access phone contacts
 */
export async function requestContactsPermission(): Promise<boolean> {
  // For web, this is not applicable
  // For mobile (React Native), you would use:
  // import { PermissionsAndroid } from 'react-native';
  // or expo-contacts for Expo

  if (typeof window === 'undefined') {
    return false;
  }

  // Check if we're in a mobile context
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) {
    // On web, we can't access native contacts
    return false;
  }

  // TODO: Implement actual permission request for mobile
  // For now, return true assuming permission will be granted
  console.log('Contact permission would be requested here on mobile');
  return true;
}

/**
 * Import contacts from phone (mobile only)
 */
export async function importPhoneContacts(): Promise<ImportContactData[]> {
  // This is a placeholder for actual mobile implementation
  // For React Native, you would use:
  // import Contacts from 'react-native-contacts';
  // or import * as Contacts from 'expo-contacts';

  console.log('Phone contacts import would happen here on mobile');

  // For web/testing, return empty array
  return [];

  // Mobile implementation example:
  // const { status } = await Contacts.requestPermissionsAsync();
  // if (status !== 'granted') {
  //   throw new Error('Permission denied');
  // }
  //
  // const { data } = await Contacts.getContactsAsync({
  //   fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
  // });
  //
  // return data.map(contact => ({
  //   name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
  //   email: contact.emails?.[0]?.email,
  //   phone: contact.phoneNumbers?.[0]?.number,
  // }));
}

/**
 * Parse raw contacts into ImportContactData format
 */
export function parseContacts(rawContacts: any[]): ImportContactData[] {
  return rawContacts.map((contact) => ({
    name: contact.name || contact.displayName || 'Unknown',
    email: contact.email || contact.emails?.[0]?.email,
    phone: contact.phone || contact.phoneNumbers?.[0]?.number,
  }));
}
