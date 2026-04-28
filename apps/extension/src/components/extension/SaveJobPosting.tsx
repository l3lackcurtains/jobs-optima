import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Link2, Briefcase, Loader2 } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';
import { makeAuthenticatedRequest } from '@/lib/api';

interface SaveJobPostingProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onJobSaved: () => void;
}

export function SaveJobPosting({ onError, onSuccess, onJobSaved }: SaveJobPostingProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentTabUrl();

    // Listen for tab changes
    const handleTabChange = () => loadCurrentTabUrl();
    chrome.tabs.onActivated.addListener(handleTabChange);
    chrome.tabs.onUpdated.addListener((_, changeInfo) => {
      if (changeInfo.status === 'complete') {
        loadCurrentTabUrl();
      }
    });

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabChange);
    };
  }, []);

  const loadCurrentTabUrl = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
      }
    } catch (err) {
      console.error('Error getting current tab:', err);
    }
  };

  const handleSaveJob = async () => {
    if (!jobDescription.trim()) {
      onError('Please enter a job description');
      return;
    }

    setIsSaving(true);

    try {
      const response = await makeAuthenticatedRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          url: currentUrl,
          description: jobDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Failed to save job (${response.status})`;
        throw new Error(errorMessage);
      }
      
      onSuccess('Job saved successfully!');
      setJobDescription('');
      onJobSaved();
    } catch (err: any) {
      onError(err.message || 'Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Save Job Posting</CardTitle>
        <CardDescription>Save current job for optimization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            URL
          </label>
          <Input
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="URL auto-populates from current tab"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Job Description
          </label>
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the complete job description..."
            className="min-h-[200px]"
          />
        </div>
        <Button 
          onClick={handleSaveJob}
          disabled={isSaving || !jobDescription.trim()}
          variant="default"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Job
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}