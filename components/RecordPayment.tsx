
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, Tenant, Payment } from '../types';
// Fix: Use dataService instead of non-existent storageService
import { dataService } from '../services/storageService';
import { MONTH_NAMES } from '../utils/constants';
import type { User } from 'firebase/auth';

interface RecordPaymentProps {
  data: AppData;
  showToast: (message: string, type?: 'success' | 'error') => void;
  user: User;
}

const TenantPaymentDetails: React.FC<{
    tenant: Tenant;
    payments: Payment[];
    // Fix: Correct the type for payment data to be passed up
    onRecordPayment: (paymentData: Omit<Payment, 'id' | 'tenantId' | 'lastModifiedAt' | 'lastModifiedBy'>) => void;
}> = ({ tenant, payments, onRecordPayment }) => {

    const [paymentData, setPaymentData] = useState({
        amount: tenant.rentAmount,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        // Reset form when tenant changes
        setPaymentData({
            amount: tenant.rentAmount,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
    }, [tenant]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({ ...prev, [name]: name === 'amount' || name === 'month' || name === 'year' ? Number(value) : value }));
    };

    const handleSubmit = () => {
        const status = paymentData.amount >= tenant.rentAmount ? 'Paid' : 'Partially Paid';
        onRecordPayment({ ...paymentData, status });
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Manage Payment for {tenant.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Rent: ₹{tenant.rentAmount.toLocaleString('en-IN')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* New Payment Form */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">Record New Payment</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                            <select name="month" value={paymentData.month} onChange={handleInputChange} className="mt-1 input-style">
                                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                            <select name="year" value={paymentData.year} onChange={handleInputChange} className="mt-1 input-style">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid</label>
                        <input type="number" name="amount" value={paymentData.amount} onChange={handleInputChange} className="mt-1 input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                        <input type="date" name="date" value={paymentData.date} onChange={handleInputChange} className="mt-1 input-style" />
                    </div>
                    <button onClick={handleSubmit} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        Record Payment
                    </button>
                </div>

                 {/* Payment History */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">Payment History</h4>
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <table className="w-full text-sm">
                            <tbody>
                                {payments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                    <tr key={p.id} className="border-b dark:border-gray-700">
                                        <td className="py-2">
                                            <p className="font-medium text-gray-800 dark:text-white">{MONTH_NAMES[p.month-1]} {p.year}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="py-2 text-right">
                                            <p className="font-semibold text-gray-800 dark:text-white">₹{p.amount.toLocaleString('en-IN')}</p>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${p.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan={2} className="py-4 text-center text-gray-500">No payment history.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const RecordPayment: React.FC<RecordPaymentProps> = ({ data, showToast, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedHostel, setSelectedHostel] = useState<string>('');
    const [selectedFloor, setSelectedFloor] = useState<string>('');
    const [selectedRoom, setSelectedRoom] = useState<string>('');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    const userEmail = user?.email || 'unknown-user';

    // Fix: Refactor to use async dataService method for recording payment
    const handleRecordPayment = async (paymentData: Omit<Payment, 'id' | 'tenantId' | 'lastModifiedAt' | 'lastModifiedBy'>) => {
        if (!selectedTenant) return;

        // Fix: Convert payments object to array to use `some`
        const alreadyPaid = Object.values(data.payments).some(p => p.tenantId === selectedTenant.id && p.month === paymentData.month && p.year === paymentData.year && p.status === 'Paid');
        if(alreadyPaid) {
            showToast(`Full payment for ${MONTH_NAMES[paymentData.month-1]} ${paymentData.year} already recorded.`, 'error');
            return;
        }
        
        const newPayment = {
            tenantId: selectedTenant.id,
            ...paymentData,
        };
        
        try {
            await dataService.recordPayment(newPayment, userEmail);
            showToast('Payment recorded successfully!');
        } catch(e) {
            showToast('Failed to record payment.', 'error');
            console.error(e);
        }
    };

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase();
        // Fix: Convert tenants, hostels, floors, rooms objects to arrays to search
        const rooms = Object.values(data.hostels).flatMap(h=>Object.values(h.floors)).flatMap(f=>Object.values(f.rooms));
        return Object.values(data.tenants).filter(t => t.name.toLowerCase().includes(query) || rooms.find(r=>r.id === t.roomId)?.roomNumber.includes(query));
    }, [searchQuery, data.tenants, data.hostels]);

    // Fix: Access hostel by key and convert its floors object to an array
    const floors = useMemo(() => data.hostels[selectedHostel] ? Object.values(data.hostels[selectedHostel].floors) : [], [selectedHostel, data.hostels]);
    // Fix: Find floor in array and convert its rooms object to an array
    const rooms = useMemo(() => floors.find(f => f.id === selectedFloor)?.rooms ? Object.values(floors.find(f => f.id === selectedFloor)!.rooms) : [], [selectedFloor, floors]);
    // Fix: Convert tenants object to array to filter
    const tenantsInRoom = useMemo(() => Object.values(data.tenants).filter(t => t.roomId === selectedRoom), [selectedRoom, data.tenants]);

    const handleSelectTenant = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setSearchQuery('');
    };

    useEffect(() => {
        setSelectedFloor('');
        setSelectedRoom('');
        setSelectedTenant(null);
    }, [selectedHostel]);

     useEffect(() => {
        setSelectedRoom('');
        setSelectedTenant(null);
    }, [selectedFloor]);

    useEffect(() => {
        if (tenantsInRoom.length === 1) {
            setSelectedTenant(tenantsInRoom[0]);
        } else {
            setSelectedTenant(null);
        }
    }, [selectedRoom, tenantsInRoom]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Record Payment</h2>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Browse by Location */}
                    <div className="space-y-2">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Browse by Location</p>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select value={selectedHostel} onChange={e => setSelectedHostel(e.target.value)} className="input-style">
                                <option value="">Select Hostel</option>
                                {/* Fix: Convert hostels object to array to map */}
                                {Object.values(data.hostels).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                            <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value)} disabled={!selectedHostel} className="input-style">
                                <option value="">Select Floor</option>
                                {floors.map(f => <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>)}
                            </select>
                            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} disabled={!selectedFloor} className="input-style">
                                <option value="">Select Room</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                            </select>
                        </div>
                         {tenantsInRoom.length > 1 && selectedRoom && (
                            <div className="pt-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Tenant in Room {rooms.find(r=>r.id === selectedRoom)?.roomNumber}:</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tenantsInRoom.map(t => (
                                        <button key={t.id} onClick={() => handleSelectTenant(t)} className={`px-3 py-1 rounded-full text-sm ${selectedTenant?.id === t.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                     {/* Search by Name/Room */}
                    <div className="space-y-2 relative">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Or Search by Name/Room No.</p>
                        <input
                            type="text"
                            placeholder="e.g. Suresh Singh or 102"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full input-style"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                                <ul>
                                    {searchResults.map(t => (
                                        <li key={t.id} onClick={() => handleSelectTenant(t)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                            {/* Fix: Convert data objects to arrays to find room */}
                                            {t.name} <span className="text-sm text-gray-500">- Room {Object.values(data.hostels).flatMap(h=>Object.values(h.floors)).flatMap(f=>Object.values(f.rooms)).find(r=>r.id === t.roomId)?.roomNumber}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedTenant && (
                <TenantPaymentDetails 
                    tenant={selectedTenant}
                    // Fix: Convert payments object to array to filter
                    payments={Object.values(data.payments).filter(p => p.tenantId === selectedTenant.id)}
                    onRecordPayment={handleRecordPayment}
                />
            )}
            
            {!selectedTenant && (
                 <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <p className="text-gray-500 dark:text-gray-400">Please select a tenant to manage their payments.</p>
                </div>
            )}

            <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); color: #111827; } .dark .input-style { background-color: #1e293b; border-color: #4b5563; color: #f9fafb; } .input-style:focus { outline: none; box-shadow: 0 0 0 2px #3b82f6; border-color: #3b82f6; } .dark .input-style:disabled { background-color: #334155; } .input-style:disabled { background-color: #f3f4f6; cursor: not-allowed; }`}</style>
        </div>
    );
};