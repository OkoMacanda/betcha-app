import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Image, Video, Link as LinkIcon, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EvidenceSubmissionProps {
  betId: string;
  userId: string;
  requiredEvidenceTypes: string[];
  onSubmissionComplete?: () => void;
}

interface EvidenceFile {
  id: string;
  file?: File;
  url?: string;
  type: 'image' | 'video' | 'document' | 'link';
  name: string;
  uploading?: boolean;
  uploaded?: boolean;
}

export function EvidenceSubmission({
  betId,
  userId,
  requiredEvidenceTypes,
  onSubmissionComplete,
}: EvidenceSubmissionProps) {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [notes, setNotes] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFileType = (file: File): EvidenceFile['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: EvidenceFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}_${file.name}`,
      file,
      type: getFileType(file),
      name: file.name,
      uploading: false,
      uploaded: false,
    }));

    setEvidenceFiles((prev) => [...prev, ...newFiles]);
  };

  const handleAddLink = () => {
    if (!externalLink.trim()) return;

    const newLink: EvidenceFile = {
      id: `link_${Date.now()}`,
      url: externalLink,
      type: 'link',
      name: externalLink,
      uploaded: true,
    };

    setEvidenceFiles((prev) => [...prev, newLink]);
    setExternalLink('');
  };

  const removeFile = (id: string) => {
    setEvidenceFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFileToStorage = async (file: File, evidenceId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${evidenceId}.${fileExt}`;
    const filePath = `evidence/${betId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('bet-evidence')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('bet-evidence')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (evidenceFiles.length === 0) {
      toast({
        title: 'No evidence provided',
        description: 'Please upload at least one piece of evidence',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all files to storage first
      const uploadedEvidence: EvidenceFile[] = [];

      for (const evidence of evidenceFiles) {
        if (evidence.file && !evidence.uploaded) {
          // Update UI to show uploading
          setEvidenceFiles((prev) =>
            prev.map((f) => (f.id === evidence.id ? { ...f, uploading: true } : f))
          );

          try {
            // Create evidence record first
            const { data: evidenceRecord, error: recordError } = await supabase
              .from('evidence')
              .insert({
                bet_id: betId,
                submitted_by: userId,
                evidence_type: evidence.type,
                file_name: evidence.name,
                notes: notes,
                status: 'pending',
              })
              .select()
              .single();

            if (recordError) throw recordError;

            // Upload file to storage
            const fileUrl = await uploadFileToStorage(evidence.file, evidenceRecord.id);

            // Update evidence record with file URL
            await supabase
              .from('evidence')
              .update({ file_url: fileUrl, status: 'submitted' })
              .eq('id', evidenceRecord.id);

            uploadedEvidence.push({ ...evidence, url: fileUrl, uploaded: true });

            // Update UI
            setEvidenceFiles((prev) =>
              prev.map((f) =>
                f.id === evidence.id ? { ...f, uploading: false, uploaded: true, url: fileUrl } : f
              )
            );
          } catch (error) {
            console.error('Error uploading evidence:', error);
            setEvidenceFiles((prev) =>
              prev.map((f) => (f.id === evidence.id ? { ...f, uploading: false } : f))
            );
            throw error;
          }
        } else if (evidence.url) {
          // For links, just create the evidence record
          const { error: recordError } = await supabase
            .from('evidence')
            .insert({
              bet_id: betId,
              submitted_by: userId,
              evidence_type: 'link',
              file_url: evidence.url,
              notes: notes,
              status: 'submitted',
            });

          if (recordError) throw recordError;

          uploadedEvidence.push(evidence);
        }
      }

      toast({
        title: 'Evidence submitted successfully',
        description: 'Your evidence has been submitted for review',
      });

      // Clear form
      setEvidenceFiles([]);
      setNotes('');

      // Callback
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast({
        title: 'Submission failed',
        description: 'Failed to submit evidence. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForType = (type: EvidenceFile['type']) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
        <CardDescription>
          Upload proof of your bet outcome. Required evidence types:{' '}
          {requiredEvidenceTypes.map((type, i) => (
            <Badge key={type} variant="outline" className="ml-1">
              {type}
              {i < requiredEvidenceTypes.length - 1 ? ',' : ''}
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="evidence-files">Upload Files</Label>
          <div className="flex gap-2">
            <Input
              id="evidence-files"
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={isSubmitting}
            />
            <Button type="button" variant="outline" size="icon" disabled={isSubmitting}>
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Accepted: Images, Videos, PDF, Word documents (max 50MB per file)
          </p>
        </div>

        {/* External Link */}
        <div className="space-y-2">
          <Label htmlFor="external-link">External Link (YouTube, social media, etc.)</Label>
          <div className="flex gap-2">
            <Input
              id="external-link"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              disabled={isSubmitting}
            />
            <Button type="button" variant="outline" onClick={handleAddLink} disabled={isSubmitting}>
              Add
            </Button>
          </div>
        </div>

        {/* Evidence List */}
        {evidenceFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Evidence Files ({evidenceFiles.length})</Label>
            <div className="space-y-2">
              {evidenceFiles.map((evidence) => (
                <div
                  key={evidence.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getIconForType(evidence.type)}
                    <span className="text-sm truncate">{evidence.name}</span>
                    {evidence.uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {evidence.uploaded && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(evidence.id)}
                    disabled={evidence.uploading || isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Provide any additional context about the evidence..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        {/* Warning */}
        <Alert>
          <AlertDescription>
            <strong>Note:</strong> All evidence will be reviewed by REF AI. False or misleading
            evidence may result in bet disputes or account penalties.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || evidenceFiles.length === 0}
            className="flex-1"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Evidence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default EvidenceSubmission;
