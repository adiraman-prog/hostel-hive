
import React, { useMemo, useState } from 'react';
import { AppData, Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: AppData;
}

type TimeRange = 'month' | 'quarter' | 'year' | 'lifetime';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center space-x-4">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    const filteredData = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let filteredPayments: Payment[] = [];
        // Fix: Convert tenants object to array to use filter
        const tenantsForDues = Object.values(data.tenants).filter(t => t.status === 'Active');

        switch(timeRange) {
            case 'month':
                // Fix: Convert payments object to array to use filter
                filteredPayments = Object.values(data.payments).filter(p => new Date(p.date) >= startOfMonth);
                break;
            case 'quarter':
                // Fix: Convert payments object to array to use filter
                filteredPayments = Object.values(data.payments).filter(p => new Date(p.date) >= startOfQuarter);
                break;
            case 'year':
                // Fix: Convert payments object to array to use filter
                filteredPayments = Object.values(data.payments).filter(p => new Date(p.date) >= startOfYear);
                break;
            case 'lifetime':
                // Fix: Convert payments object to array
                filteredPayments = Object.values(data.payments);
                break;
        }
        
        return { payments: filteredPayments, tenants: tenantsForDues };

    }, [data, timeRange]);
    
    const stats = useMemo(() => {
        // Fix: Convert tenants object to array to use filter and get length
        const totalTenants = Object.values(data.tenants).filter(t => t.status === 'Active').length;
        // Fix: Convert hostels, floors, and rooms objects to arrays to use reduce
        const totalCapacity = Object.values(data.hostels).reduce((acc, hostel) => 
            acc + Object.values(hostel.floors).reduce((fAcc, floor) => 
                fAcc + Object.values(floor.rooms).reduce((rAcc, room) => rAcc + room.capacity, 0), 0), 0);

        const occupancy = totalCapacity > 0 ? ((totalTenants / totalCapacity) * 100).toFixed(1) + '%' : 'N/A';
        
        const revenue = filteredData.payments.reduce((sum, p) => sum + p.amount, 0);

        // For dues, we check who hasn't paid in the current month, regardless of the time range filter
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        // Fix: Convert tenants and payments objects to arrays to use filter and some
        const totalDue = Object.values(data.tenants)
            .filter(tenant => tenant.status === 'Active')
            .reduce((acc, tenant) => {
                const hasPaid = Object.values(data.payments).some(p => p.tenantId === tenant.id && p.month === currentMonth && p.year === currentYear);
                return hasPaid ? acc : acc + tenant.rentAmount;
        }, 0);
        
        return { totalTenants, occupancy, revenue, totalDue };
    }, [data, filteredData]);

    const chartData = useMemo(() => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();

        if (timeRange === 'lifetime') {
            const yearlyRevenue: { [key: string]: number } = {};
            // Fix: Convert payments object to array to use forEach
            Object.values(data.payments).forEach(p => {
                yearlyRevenue[p.year] = (yearlyRevenue[p.year] || 0) + p.amount;
            });
            return Object.keys(yearlyRevenue).map(year => ({ name: year, revenue: yearlyRevenue[year] }));
        }

        const monthlyRevenue: { [key: string]: number } = {};
        // Fix: Convert payments object to array to use filter and forEach
        Object.values(data.payments).filter(p => p.year === currentYear).forEach(payment => {
            const monthName = monthNames[payment.month - 1];
            monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + payment.amount;
        });
        
        return monthNames.map(name => ({ name, revenue: monthlyRevenue[name] || 0 }));

    }, [data.payments, timeRange]);

    const timeRangeLabels: {[key in TimeRange]: string} = {
      month: "This Month's Revenue",
      quarter: "This Quarter's Revenue",
      year: "This Year's Revenue",
      lifetime: "Lifetime Revenue"
    };

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 space-x-1">
                {(['month', 'quarter', 'year', 'lifetime'] as TimeRange[]).map(range => (
                    <button 
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${timeRange === range ? 'bg-white dark:bg-gray-800 text-blue-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                ))}
            </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Tenants" value={stats.totalTenants} color="bg-blue-100 dark:bg-blue-900" icon={<svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <StatCard title="Occupancy Rate" value={stats.occupancy} color="bg-green-100 dark:bg-green-900" icon={<svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
            <StatCard title={timeRangeLabels[timeRange]} value={`₹${stats.revenue.toLocaleString('en-IN')}`} color="bg-indigo-100 dark:bg-indigo-900" icon={<svg className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
            <StatCard title="This Month's Dues" value={`₹${stats.totalDue.toLocaleString('en-IN')}`} color="bg-red-100 dark:bg-red-900" icon={<svg className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{timeRange === 'lifetime' ? 'Revenue Per Year' : `Monthly Revenue (${new Date().getFullYear()})`}</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                        <YAxis tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `₹${Number(value)/1000}k`} />
                        <Tooltip
                            cursor={{ fill: 'rgba(128, 128, 128, 0.1)'}}
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#f9fafb' }}
                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};
