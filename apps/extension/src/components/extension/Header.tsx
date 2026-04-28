import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { FileText, LogOut, Moon, Sun, User, ExternalLink, Settings, Code } from 'lucide-react';
import { WEB_URL } from '@/lib/constants';
import { useDeveloperMode } from '@/hooks/use-developer-mode';

interface HeaderProps {
  theme: 'light' | 'dark';
  user: { id: string; email: string; name: string } | null;
  onThemeToggle: () => void;
  onLogout: () => void;
}

export function Header({ theme, user, onThemeToggle, onLogout }: HeaderProps) {
  const { isDeveloperMode, toggleDeveloperMode } = useDeveloperMode();

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const openWebApp = () => {
    chrome.tabs.create({ url: WEB_URL });
  };

  return (
    <div className="w-full border-b bg-background">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Jobs Optima</span>
            <Badge variant="secondary" className="text-xs">Extension</Badge>
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDeveloperMode}
            className="h-8 w-8"
            title={isDeveloperMode ? "Disable Developer Mode" : "Enable Developer Mode"}
          >
            <Code className={`h-4 w-4 ${isDeveloperMode ? 'text-green-500' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="h-8 w-8"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name || user.email} />
                    <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openWebApp}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Open Web App</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onThemeToggle}>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}