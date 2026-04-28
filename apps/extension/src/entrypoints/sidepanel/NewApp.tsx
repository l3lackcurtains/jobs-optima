import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/extension/LoginForm';
import { Header } from '@/components/extension/Header';
import { QuickAutofill } from '@/components/extension/QuickAutofill';
import { SaveJobPosting } from '@/components/extension/SaveJobPosting';
import { RecentJobs } from '@/components/extension/RecentJobs';
import { Settings } from '@/components/extension/Settings';
import { STORAGE_KEYS, DEFAULT_THEME } from '@/lib/constants';
import './globals.css';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
  };
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(DEFAULT_THEME);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autofillError, setAutofillError] = useState('');
  const [autofillSuccess, setAutofillSuccess] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [jobsSuccess, setJobsSuccess] = useState('');
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [jobRefreshTrigger, setJobRefreshTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const checkAuthStatus = async () => {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
      if (result.token && result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: AuthResponse['user']) => {
    setIsAuthenticated(true);
    setUser(userData);
    setJobRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAutofillError = (message: string) => {
    setAutofillError(message);
    setTimeout(() => setAutofillError(''), 5000);
  };

  const handleAutofillSuccess = (message: string) => {
    setAutofillSuccess(message);
    setTimeout(() => setAutofillSuccess(''), 5000);
  };

  const handleJobsError = (message: string) => {
    setJobsError(message);
    setTimeout(() => setJobsError(''), 5000);
  };

  const handleJobsSuccess = (message: string) => {
    setJobsSuccess(message);
    setTimeout(() => setJobsSuccess(''), 5000);
  };

  const handleJobSaved = () => {
    setJobRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        theme={theme}
        user={user}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
        onSettingsToggle={() => setShowSettings(prev => !prev)}
      />

      {showSettings ? (
        <Settings onBack={() => setShowSettings(false)} />
      ) : !isAuthenticated ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (

      <div className="flex-1 flex flex-col">
        {/* Tabs Layout */}
        <Tabs defaultValue="autofill" className="flex-1 flex flex-col">
          <div className="px-4 pt-3">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="autofill" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Autofill
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Jobs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TabsContent value="autofill" className="mt-4 space-y-4">
              {/* Autofill Tab Alerts */}
              {(autofillError || autofillSuccess) && (
                <div>
                  {autofillError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
                      <AlertCircle className="h-4 w-4" />
                      {autofillError}
                    </div>
                  )}
                  {autofillSuccess && (
                    <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md mb-4">
                      <CheckCircle className="h-4 w-4" />
                      {autofillSuccess}
                    </div>
                  )}
                </div>
              )}
              <QuickAutofill 
                isAuthenticated={isAuthenticated}
                onError={handleAutofillError}
                onSuccess={handleAutofillSuccess}
              />
            </TabsContent>

            <TabsContent value="jobs" className="mt-4 space-y-4">
              {/* Jobs Tab Alerts */}
              {(jobsError || jobsSuccess) && (
                <div>
                  {jobsError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
                      <AlertCircle className="h-4 w-4" />
                      {jobsError}
                    </div>
                  )}
                  {jobsSuccess && (
                    <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md mb-4">
                      <CheckCircle className="h-4 w-4" />
                      {jobsSuccess}
                    </div>
                  )}
                </div>
              )}
              <SaveJobPosting 
                onError={handleJobsError}
                onSuccess={handleJobsSuccess}
                onJobSaved={handleJobSaved}
              />
              
              <RecentJobs refreshTrigger={jobRefreshTrigger} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      )}
    </div>
  );
}