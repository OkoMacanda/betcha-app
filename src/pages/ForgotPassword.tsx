import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import Navigation from '@/components/Navigation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  usePageSEO({
    title: 'Forgot Password - Betcha',
    description: 'Reset your Betcha account password.',
    canonicalPath: '/forgot-password'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (!error) {
      setEmailSent(true);
    }

    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center px-4 py-8 gradient-hero min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-9rem)]">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center mb-6 md:mb-8">
              <img
                src="/logo.png"
                alt="Betcha Logo"
                className="h-24 sm:h-32 md:h-40 w-auto object-contain logo-glow"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Betcha
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                variant="hero"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Resend Email
              </Button>
            </CardFooter>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex items-center justify-center px-4 py-8 gradient-hero min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-9rem)]">
        <div className="w-full max-w-md">
          {/* Logo - Responsive */}
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <img
              src="/logo.png"
              alt="Betcha Logo"
              className="h-24 sm:h-32 md:h-40 w-auto object-contain logo-glow"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Betcha
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 text-base"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                variant="hero"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
