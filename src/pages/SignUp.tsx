import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import Navigation from '@/components/Navigation';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp } = useAuth();
  const navigate = useNavigate();

  usePageSEO({
    title: 'Sign Up - Challenger',
    description: 'Create your Challenger account and start competing in regulated challenges.',
    canonicalPath: '/signup'
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (!error) {
      // Show success message and redirect handled by hook
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex items-center justify-center px-4 py-8 gradient-hero min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-9rem)]">
        <div className="w-full max-w-md">
          {/* Logo - Responsive & GLOWING */}
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <img
              src="/logo.png"
              alt="Challenger Logo"
              className="h-24 sm:h-32 md:h-40 w-auto object-contain logo-glow"
            onError={(e) => {
              // Fallback to Trophy icon if logo fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Challenger
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Join thousands backing up their competitive projections
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 text-base"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

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
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 text-base"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 text-base"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-destructive">{errors.terms}</p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                variant="hero"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign in
                </Link>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
    </div>
  );
};

export default SignUp;
