import React, { useState, useMemo } from 'react';
import { generateReport } from '../services/geminiService';
import { AppData } from '../types';
import { dataService } from '../services/storageService';
import type { User } from 'firebase/auth';

interface ReportGeneratorProps {
  data: AppData;
  user: User;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

// A simple markdown parser to enhance report readability.
const simpleMarkdownParse = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings (e.g., #, ##)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

    // Unordered lists (* or -)
    html = html.replace(/^\s*[\-\*] (.*)/gim, '<ul><li>$1</li></ul>')
               .replace(/<\/ul>\s?<ul>/gim, ''); // Merge consecutive lists
               
    // Ordered lists (1.)
    html = html.replace(/^\s*\d+\. (.*)/gim, '<ol><li>$1</li></ol>')
               .replace(/<\/ol>\s?<ol>/gim, ''); // Merge consecutive lists
               
    // Replace newlines with <br>, but not for list items
    html = html.split('\n').map(line => {
      if (line.match(/^\s*?(<[u|o]l><li>)/)) {
        return line;
      }
      return line;
    }).join('<br />').replace(/<br \/>\s*<br \/>/g, '<br />'); // handle extra line breaks
    
    // Clean up <br> tags around block elements
    html = html.replace(/<br \/>(\s*?)(<[h|u|o|l])/gim, '$1$2'); 
    html = html.replace(/(<\/[h|u|o|l]i?>)(\s*?)<br \/>/gim, '$1$2');

    return html;
};


export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data, user }) => {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const userEmail = user?.email || 'unknown-user';

  const handleGenerateReport = async () => {
    if (!query.trim()) {
      setError('Please enter a query.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReport('');
    let fullReport = '';
    try {
      const reportStream = await generateReport(data, query);
      for await (const chunk of reportStream) {
        setReport(prev => prev + chunk);
        fullReport += chunk;
      }
      if (fullReport) {
        await dataService.addReportToHistory({ query, report: fullReport }, userEmail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedHistory = useMemo(() => {
    if (!data.reportHistory) return [];
    return Object.values(data.reportHistory).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data.reportHistory]);

  const toggleReport = (id: string) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">AI Report Generator</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Ask anything about your hostel data. For example: "Who has pending payments for this month?" or "Give me a summary of Sunshine Hostel".
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleGenerateReport()}
            placeholder="e.g., List all vacant rooms"
            className="flex-grow px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {(report || isLoading) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
           <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Generated Report</h3>
           <div 
             className="prose prose-blue dark:prose-invert max-w-none"
             dangerouslySetInnerHTML={{ __html: simpleMarkdownParse(report) }} 
            />
             {isLoading && !report && <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>}
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Report History</h3>
        <div className="space-y-4">
          {sortedHistory.length > 0 ? (
            sortedHistory.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <button 
                  onClick={() => toggleReport(item.id)}
                  className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white truncate">{item.query}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedReportId === item.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedReportId === item.id && (
                  <div className="p-6 border-t dark:border-gray-700">
                    <div 
                      className="prose prose-blue dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: simpleMarkdownParse(item.report) }} 
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <p className="text-gray-500 dark:text-gray-400">No report history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};