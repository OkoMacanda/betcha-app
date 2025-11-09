import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, Clock, XCircle, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import Navigation from '@/components/Navigation';

const KYC = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useWallet();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [isUploading, setIsUploading] = useState(false);

  usePageSEO({
    title: 'KYC Verification - Betcha',
    description: 'Complete your identity verification',
    canonicalPath: '/kyc'
  });

  const handleFileChange = (field: 'idFront' | 'idBack' | 'selfie') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        });
        return;
      }

      setDocuments(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleUpload = async () => {
    if (!documents.idFront || !documents.idBack || !documents.selfie) {
      toast({
        title: 'Missing documents',
        description: 'Please upload all required documents',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload files to Supabase Storage
      const timestamp = Date.now();
      const uploadPromises = [
        {
          file: documents.idFront,
          path: `${user?.id}/id_front_${timestamp}.jpg`,
          field: 'id_front_url',
        },
        {
          file: documents.idBack,
          path: `${user?.id}/id_back_${timestamp}.jpg`,
          field: 'id_back_url',
        },
        {
          file: documents.selfie,
          path: `${user?.id}/selfie_${timestamp}.jpg`,
          field: 'selfie_url',
        },
      ];

      const uploadedPaths: Record<string, string> = {};

      for (const { file, path, field } of uploadPromises) {
        const { error } = await supabase.storage
          .from('kyc-documents')
          .upload(path, file, { upsert: true });

        if (error) {
          // If bucket doesn't exist, show helpful error
          if (error.message.includes('not found') || error.message.includes('does not exist')) {
            throw new Error(
              'KYC document storage is not configured. Please contact support to enable document uploads.'
            );
          }
          throw error;
        }

        uploadedPaths[field] = path;
      }

      // Create KYC verification record
      const { error: kycError } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: user?.id,
          status: 'pending',
          id_front_url: uploadedPaths.id_front_url,
          id_back_url: uploadedPaths.id_back_url,
          selfie_url: uploadedPaths.selfie_url,
          submitted_at: new Date().toISOString(),
        });

      if (kycError) throw kycError;

      // Update profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      toast({
        title: 'Documents submitted successfully',
        description: 'Your documents are under review. We\'ll notify you once verified.',
      });

      // Refresh the page to show updated status
      window.location.reload();

    } catch (error: any) {
      console.error('KYC upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
      case 'under_review':
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Under Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verified view
  if (profile?.kyc_status === 'verified') {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Button>

        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-500" />
                  KYC Verification
                </CardTitle>
                {getStatusBadge('verified')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Verification Complete</h3>
                <p className="text-muted-foreground text-center">
                  Your identity has been successfully verified. You can now withdraw funds from your wallet.
                </p>
                <Button onClick={() => navigate('/wallet')} className="mt-6">
                  Go to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending/Under Review view
  if (profile?.kyc_status === 'pending' || profile?.kyc_status === 'under_review') {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-background">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Button>

        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-orange-500" />
                  KYC Verification
                </CardTitle>
                {getStatusBadge(profile.kyc_status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8">
                <Clock className="w-20 h-20 text-orange-500 mb-4 animate-pulse" />
                <h3 className="text-2xl font-semibold mb-2">Documents Under Review</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Thank you for submitting your documents. Our team is currently reviewing them.
                  This usually takes 1-2 business days. We'll send you an email once the verification is complete.
                </p>
                <Alert className="mt-6 max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You cannot withdraw funds until your identity is verified. Deposits and betting are still available.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Upload form view (not started or rejected)
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="p-4 md:p-8 bg-background">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Button>

        <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Shield className="w-6 h-6" />
                  KYC Verification
                </CardTitle>
                <CardDescription>
                  Upload your identity documents to verify your account and enable withdrawals
                </CardDescription>
              </div>
              {profile?.kyc_status && getStatusBadge(profile.kyc_status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile?.kyc_status === 'rejected' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Your previous KYC submission was rejected. Please review the requirements and resubmit
                  with valid documents.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required documents:</strong> Please upload clear, high-quality images. All text must be readable.
                Files must be under 5MB and in image format (JPG, PNG).
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idFront">
                  Government-issued ID (Front) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="idFront"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('idFront')}
                  disabled={isUploading}
                />
                {documents.idFront && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {documents.idFront.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload the front of your passport, driver's license, or national ID card
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idBack">
                  Government-issued ID (Back) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="idBack"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('idBack')}
                  disabled={isUploading}
                />
                {documents.idBack && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {documents.idBack.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload the back of your ID document (if applicable)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selfie">
                  Selfie with ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="selfie"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('selfie')}
                  disabled={isUploading}
                />
                {documents.selfie && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {documents.selfie.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Take a selfie holding your ID next to your face
                </p>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy notice:</strong> Your documents are securely encrypted and will only be used
                for identity verification purposes. We comply with all data protection regulations.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button
                onClick={handleUpload}
                disabled={!documents.idFront || !documents.idBack || !documents.selfie || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Documents
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate('/wallet')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default KYC;
