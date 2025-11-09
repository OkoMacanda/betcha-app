import { useState } from 'react';
import { Contact, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { requestContactsPermission, importPhoneContacts } from '@/hooks/useContacts';
import { useContacts } from '@/hooks/useContacts';

export default function ContactsPermission() {
  const { importContacts } = useContacts();
  const [status, setStatus] = useState<'idle' | 'requesting' | 'importing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setStatus('requesting');
    setError('');

    try {
      // Request permission
      const hasPermission = await requestContactsPermission();

      if (!hasPermission) {
        setError('Permission denied');
        setStatus('error');
        return;
      }

      setStatus('importing');
      setProgress(30);

      // Import contacts from phone
      const phoneContacts = await importPhoneContacts();
      setProgress(60);

      if (phoneContacts.length === 0) {
        setError('No contacts found');
        setStatus('error');
        return;
      }

      // Upload to database
      await importContacts(phoneContacts);
      setProgress(100);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Failed to import contacts');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Contacts Imported!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your contacts have been synced successfully
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Contact className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Import Contacts</CardTitle>
            <CardDescription>Find friends who are already on Betcha</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'importing' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Importing contacts securely...</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleImport}
            disabled={status === 'requesting' || status === 'importing'}
            className="w-full"
          >
            {status === 'requesting' && 'Requesting Permission...'}
            {status === 'importing' && 'Importing...'}
            {status === 'idle' && 'Import from Phone'}
            {status === 'error' && 'Try Again'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We'll only access names and contact info. We never access messages or call logs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
