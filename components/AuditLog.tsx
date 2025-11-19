// components/AuditLog.tsx
import React, { useMemo } from 'react';
import { AppData } from '../types';

interface AuditLogProps {
  data: AppData;
}

export const AuditLog: React.FC<AuditLogProps> = ({ data }) => {
    const sortedLogs = useMemo(() => {
        return [...data.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [data.auditLogs]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Audit Log</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLogs.map(log => (
                            <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 font-medium text-gray-800 dark:text-white whitespace-nowrap">
                                    {log.user}
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    {log.action}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No audit history found.
                    </div>
                )}
            </div>
        </div>
    );
};
