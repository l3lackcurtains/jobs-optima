import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { STORAGE_KEYS, DEFAULT_API_URL, DEFAULT_WEB_URL } from '@/lib/constants';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.API_URL, STORAGE_KEYS.WEB_URL]).then(result => {
      setApiUrl(result[STORAGE_KEYS.API_URL] || DEFAULT_API_URL);
      setWebUrl(result[STORAGE_KEYS.WEB_URL] || DEFAULT_WEB_URL);
    });
  }, []);

  const handleSave = async () => {
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_URL]: apiUrl.trim(),
      [STORAGE_KEYS.WEB_URL]: webUrl.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setApiUrl(DEFAULT_API_URL);
    setWebUrl(DEFAULT_WEB_URL);
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch(`${apiUrl.trim()}/health`, { signal: AbortSignal.timeout(5000) });
      setTestStatus(res.ok ? 'ok' : 'error');
    } catch {
      setTestStatus('error');
    }
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Server Configuration</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">API URL</label>
                <Input
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8888/api"
                  className="text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">Your backend API endpoint</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Web App URL</label>
                <Input
                  value={webUrl}
                  onChange={e => setWebUrl(e.target.value)}
                  placeholder="http://localhost:4000"
                  className="text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">Used for "Open Web App" links</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleTest} variant="outline" size="sm" disabled={testStatus === 'testing'} className="flex-1">
              {testStatus === 'testing' && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              {testStatus === 'ok' && <CheckCircle className="mr-2 h-3 w-3 text-green-500" />}
              {testStatus === 'error' && <AlertCircle className="mr-2 h-3 w-3 text-destructive" />}
              {testStatus === 'idle' ? 'Test Connection' : testStatus === 'testing' ? 'Testing…' : testStatus === 'ok' ? 'Connected' : 'Unreachable'}
            </Button>
            <Button onClick={handleReset} variant="ghost" size="sm" title="Reset to defaults">
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
            <CheckCircle className="h-4 w-4" />
            Settings saved
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <Button onClick={handleSave} className="w-full">Save Settings</Button>
      </div>
    </div>
  );
}
