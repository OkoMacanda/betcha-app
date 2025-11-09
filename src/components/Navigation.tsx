import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, Trophy, Wallet, LogOut, Target, Users, UserCircle, History, Settings } from 'lucide-react';

export function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Games', path: '/games', icon: Target },
    { label: 'Create Challenge', path: '/create-challenge', protected: true },
    { label: 'Active Challenges', path: '/active-challenges', protected: true },
    { label: 'Contacts', path: '/contacts', icon: UserCircle, protected: true },
    { label: 'Groups', path: '/groups', icon: Users, protected: true },
    { label: 'History', path: '/challenge-history', icon: History, protected: true },
    { label: 'Wallet', path: '/wallet', icon: Wallet, protected: true },
  ];

  const filteredNavLinks = navLinks.filter(link => !link.protected || user);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 md:h-36 items-center justify-between px-4">
        {/* Logo - ABSOLUTELY MASSIVE & GLOWING */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="Challenger"
            className="h-16 md:h-32 w-auto object-contain logo-glow"
            onError={(e) => {
              // Fallback to Trophy icon if logo fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div className="hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Challenger
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {filteredNavLinks.map(link => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? 'default' : 'ghost'}
              onClick={() => navigate(link.path)}
              className={isActive(link.path) ? '' : 'text-muted-foreground'}
            >
              {link.label}
            </Button>
          ))}
        </nav>

        {/* Desktop Auth Buttons / User Menu */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      My Account
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/wallet')}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/active-challenges')}>
                  <Target className="mr-2 h-4 w-4" />
                  Active Challenges
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/contacts')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Contacts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/groups')}>
                  <Users className="mr-2 h-4 w-4" />
                  Groups
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/challenge-history')}>
                  <History className="mr-2 h-4 w-4" />
                  Challenge History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/teams')}>
                  <Users className="mr-2 h-4 w-4" />
                  Teams
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="hero" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-3 mt-6">
              {filteredNavLinks.map(link => (
                <Button
                  key={link.path}
                  variant={isActive(link.path) ? 'default' : 'ghost'}
                  className="w-full justify-start h-12 text-base"
                  onClick={() => {
                    navigate(link.path);
                    // Close sheet (handled automatically by shadcn)
                  }}
                >
                  {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                  {link.label}
                </Button>
              ))}

              {user ? (
                <>
                  <div className="my-4 border-t" />
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">My Account</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => navigate('/contacts')}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Contacts
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => navigate('/groups')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Groups
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => navigate('/challenge-history')}
                  >
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => navigate('/teams')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Teams
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 text-base text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <div className="my-4 border-t" />
                  <Button variant="hero" className="w-full h-12 text-base" onClick={() => navigate('/signup')}>
                    Sign Up
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-base" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default Navigation;
