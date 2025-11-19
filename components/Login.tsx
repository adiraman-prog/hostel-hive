// components/Login.tsx
import React, { useState } from 'react';
import { dataService } from '../services/storageService';

interface LoginProps {
    // No longer needs authError prop as it manages it internally
    authError?: any; 
}

export const Login: React.FC<LoginProps> = () => {
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<{ message: string; hostname?: string; code?: string; } | null>(null);
    
    const handleLogin = async () => {
        setError(null);
        try {
            await dataService.signInWithGoogle();
            // Successful login will trigger the onAuthStateChanged listener in App.tsx
        } catch (err: any) {
            console.error("Login failed", err);
             if (err?.code === 'auth/unauthorized-domain') {
                const hostname = window.location.hostname;
                setError({ 
                    message: "This app's domain is not authorized for authentication.",
                    hostname: hostname,
                    code: err.code
                });
            } else if (err?.code === 'auth/popup-closed-by-user') {
                 setError(null); // Ignore if user just closed the popup
            } else {
                setError({ 
                    message: err.message || "An unexpected error occurred during sign-in. Please try again.",
                    code: err.code || 'unknown'
                });
            }
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zm1 1v2h3V5H5zm8 0h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 01-1-1V5a1 1 0 011-1zm1 1v2h3V5h-3zM4 11h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1zm1 1v2h3v-2H5zm8 0h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 01-1-1v-2a1 1 0 011-1zm1 1v2h3v-2h-3z" clipRule="evenodd" />
                           <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" />
                       </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Hostel Hive</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to manage your properties.</p>
                </div>
                
                {error && error.code === 'auth/unauthorized-domain' && error.hostname ? (
                    <div className="bg-amber-50 dark:bg-amber-900/50 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-md" role="alert">
                        <p className="font-bold">Configuration Required</p>
                        <p className="text-sm mt-1">To enable Google Sign-In, you must authorize this application's domain in your Firebase project.</p>
                        <ol className="list-decimal list-inside text-sm mt-3 space-y-1">
                            <li>Open your Firebase project console.</li>
                            <li>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.</li>
                            <li>Click <strong>"Add domain"</strong>.</li>
                            <li>Copy and paste the domain below:</li>
                        </ol>
                        <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-800/50 rounded flex items-center justify-between gap-4">
                            <code className="font-mono text-sm text-amber-900 dark:text-amber-100 break-all">{error.hostname}</code>
                            <button 
                                onClick={() => handleCopy(error.hostname!)}
                                className={`text-xs font-bold py-1 px-3 rounded-md flex-shrink-0 transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md" role="alert">
                        <p className="font-bold">Authentication Error</p>
                        <p>{error.message}</p>
                    </div>
                ) : null}

                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 266.4 0 130.6 109.8 21.8 244 21.8c65.3 0 125.6 23.4 170.3 62.6l-65.7 64.3c-24.3-22.4-56.8-36.4-94.6-36.4-73.3 0-133.4 59.9-133.4 133.4s60.1 133.4 133.4 133.4c79.9 0 119.5-57.5 124.1-88.4H244v-75.1h243.1c1.3 12.8 1.9 26.6 1.9 40.8z"></path></svg>
                    Sign in with Google
                </button>
                 <div className="text-xs text-center text-gray-500 dark:text-gray-400 !mt-8">
                    <p>&copy; {new Date().getFullYear()} Hostel Hive. Your simplified management solution.</p>
                </div>
            </div>
        </div>
    );
};