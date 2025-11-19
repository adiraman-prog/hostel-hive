
import React, { useState, useMemo } from 'react';
import { AppData, Payment } from '../types';
import { MONTH_NAMES } from '../utils/constants';

interface PaymentHistoryProps {
  data: AppData;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedHostel, setSelectedHostel] = useState<string>('all');

  const yearsWithPayments = useMemo(() => {
    // Fix: Use Object.keys to check length of payments object
    if (Object.keys(data.payments).length === 0) {
      return [new Date().getFullYear()];
    }
    // Fix: Convert payments object to array to map
    const years = new Set(Object.values(data.payments).map(p => p.year));
    // Fix: Add explicit types to sort function arguments to resolve arithmetic operation error.
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [data.payments]);

  const filteredPayments = useMemo(() => {
    // Fix: Convert payments object to array to filter
    return Object.values(data.payments).filter(p => {
        const yearMatch = p.year === selectedYear;
        const monthMatch = p.month === selectedMonth;
        if (!yearMatch || !monthMatch) return false;

        if (selectedHostel === 'all') return true;
        
        // Fix: Access tenant by key
        const tenant = data.tenants[p.tenantId];
        return tenant?.hostelId === selectedHostel;
    });
  }, [data.payments, data.tenants, selectedYear, selectedMonth, selectedHostel]);
  
  const totalRevenue = useMemo(() => {
      return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const filterTitle = useMemo(() => {
    if (selectedHostel === 'all') {
        return `All Hostels`;
    }
    // Fix: Access hostel by key
    const hostel = data.hostels[selectedHostel];
    return hostel ? hostel.name : 'All Hostels';
  }, [selectedHostel, data.hostels]);

  const getPaymentDetails = (payment: Payment) => {
      // Fix: Access tenant by key
      const tenant = data.tenants[payment.tenantId];
      if (!tenant) return null;

      // Fix: Convert hostels, floors, and rooms objects to arrays to find the room
      const room = Object.values(data.hostels).flatMap(h => Object.values(h.floors)).flatMap(f => Object.values(f.rooms)).find(r => r.id === tenant.roomId);
      const hostel = data.hostels[tenant.hostelId];

      return {
          tenantName: tenant.name,
          hostelName: hostel?.name || 'N/A',
          roomNumber: room?.roomNumber || 'N/A',
      };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Payment History</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="year-select" className="font-semibold text-gray-700 dark:text-gray-300">Filter by:</label>
            <select
              id="hostel-select"
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Hostels</option>
              {/* Fix: Convert hostels object to array to map */}
              {Object.values(data.hostels).map(hostel => (
                  <option key={hostel.id} value={hostel.id}>{hostel.name}</option>
              ))}
            </select>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearsWithPayments.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTH_NAMES.map((month, index) => (
                // Fix: Use index as key to resolve potential "Type 'unknown' is not assignable to type 'Key'" error.
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
        </div>
        <div className="text-right flex-shrink-0 mt-4 md:mt-0">
            <p className="text-gray-500 dark:text-gray-400">Total Revenue for {filterTitle}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-400">
            <tr>
              <th className="p-4">Tenant Name</th>
              <th className="p-4">Hostel</th>
              <th className="p-4">Room</th>
              <th className="p-4">Payment Date</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => {
              const details = getPaymentDetails(payment);
              return (
                <tr key={payment.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 text-gray-800 dark:text-white">{details?.tenantName || 'Unknown Tenant'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{details?.hostelName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{details?.roomNumber}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="p-4 text-right font-semibold text-gray-800 dark:text-white">₹{payment.amount.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No payments found for {filterTitle} in {MONTH_NAMES[selectedMonth - 1]}, {selectedYear}.
          </div>
        )}
      </div>
    </div>
  );
};
