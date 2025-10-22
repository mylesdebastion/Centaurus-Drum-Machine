import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const SupabaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [envVarsLoaded, setEnvVarsLoaded] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Verify environment variables
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          setStatus('error');
          setErrorMessage('Environment variables not loaded. Check .env.development file.');
          return;
        }

        setEnvVarsLoaded(true);

        // Test 2: Test Supabase connection
        const { error } = await supabase.from('sessions').select('*').limit(1);

        if (error) {
          setStatus('error');
          setErrorMessage(`Supabase error: ${error.message}`);
          return;
        }

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Supabase Connection Test</h2>

      <div className="space-y-4">
        {/* Environment Variables Check */}
        <div className="flex items-center gap-3">
          {envVarsLoaded ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-gray-300">Environment variables loaded</span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-3">
          {status === 'checking' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}

          <span className="text-gray-300">
            {status === 'checking' && 'Testing Supabase connection...'}
            {status === 'success' && 'Supabase connected successfully'}
            {status === 'error' && 'Connection failed'}
          </span>
        </div>

        {/* Error Message */}
        {status === 'error' && errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-red-400 text-sm font-mono">{errorMessage}</p>
          </div>
        )}

        {/* Success Details */}
        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
            <p className="text-green-400 text-sm">
              ✅ Supabase project: {import.meta.env.VITE_SUPABASE_URL}
            </p>
            <p className="text-green-400 text-sm mt-2">
              ✅ Sessions table accessible
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
