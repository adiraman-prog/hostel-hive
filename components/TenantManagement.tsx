import React, { useState, useMemo, useEffect } from 'react';
import { AppData, Tenant } from '../types';
import { dataService } from '../services/storageService';
import { Modal } from './common/Modal';
import type { User } from 'firebase/auth';

interface TenantManagementProps {
  data: AppData;
  showToast: (message: string, type?: 'success' | 'error') => void;
  user: User;
}

const emptyTenant: Omit<Tenant, 'id' | 'lastModifiedAt' | 'lastModifiedBy'> = {
  name: '',
  phone: '',
  email: '',
  checkInDate: new Date().toISOString().split('T')[0],
  rentAmount: 0,
  securityDeposit: 0,
  status: 'Active',
  hostelId: '',
  floorId: '',
  roomId: '',
  nativeAddress: '',
  aadharId: '',
};

export const TenantManagement: React.FC<TenantManagementProps> = ({ data, showToast, user }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'deactivate'>('add');

  const [currentTenant, setCurrentTenant] = useState<Tenant | Omit<Tenant, 'id' | 'lastModifiedAt' | 'lastModifiedBy'>>(emptyTenant);
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');

  const userEmail = user?.email || 'unknown-user';

  const availableFloors = useMemo(() => {
    const hostel = data.hostels[selectedHostel];
    return hostel ? Object.values(hostel.floors) : [];
  }, [selectedHostel, data.hostels]);
  
  const availableRooms = useMemo(() => {
    const floor = availableFloors.find(f => f.id === selectedFloor);
    return floor ? Object.values(floor.rooms).filter(r => r.tenantIds.length < r.capacity) : [];
  }, [selectedFloor, availableFloors]);

  useEffect(() => {
      if (modalMode === 'add') {
         setCurrentTenant(prev => ({ ...prev, floorId: '', roomId: '' }));
         setSelectedFloor('');
      } else if ('hostelId' in currentTenant) {
         setSelectedFloor(currentTenant.floorId)
      }
  }, [selectedHostel]);

  useEffect(() => {
      if (modalMode === 'add') {
        setCurrentTenant(prev => ({ ...prev, roomId: '' }));
      }
  }, [selectedFloor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['rentAmount', 'securityDeposit'].includes(name);
    setCurrentTenant({ ...currentTenant, [name]: isNumberField ? Number(value) : value });
    if (name === 'hostelId') {
      setSelectedHostel(value);
    }
    if (name === 'floorId') {
      setSelectedFloor(value);
    }
  };
  
  const openModal = (mode: 'add' | 'edit' | 'deactivate', tenant?: Tenant) => {
    setModalMode(mode);
    if (mode === 'add') {
      setCurrentTenant(emptyTenant);
      setSelectedHostel('');
      setSelectedFloor('');
    } else if (tenant) {
      setCurrentTenant(tenant);
      setSelectedHostel(tenant.hostelId);
      setSelectedFloor(tenant.floorId);
    }
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    // Give modal time to close before resetting state
    setTimeout(() => {
        setCurrentTenant(emptyTenant);
        setSelectedHostel('');
        setSelectedFloor('');
    }, 300);
  };


  const handleSubmit = async () => {
    if (!('name' in currentTenant) || !currentTenant.name || !currentTenant.roomId) {
      showToast('Name and Room selection are required.', 'error');
      return;
    }
    try {
        if (modalMode === 'add') {
            await dataService.addTenant(currentTenant as Omit<Tenant, 'id' | 'lastModifiedAt' | 'lastModifiedBy'>, userEmail);
            showToast('Tenant added successfully!');
        } else if (modalMode === 'edit' && 'id' in currentTenant) {
            await dataService.updateTenant(currentTenant, userEmail);
            showToast('Tenant updated successfully!');
        }
        closeModal();
    } catch(e) {
        showToast(`Failed to ${modalMode} tenant.`, 'error');
        console.error(e);
    }
  };

  const handleDeactivateTenant = async () => {
    if (!('id' in currentTenant) || !leavingDate) {
      showToast('Leaving date is required.', 'error');
      return;
    }
    try {
        await dataService.deactivateTenant(currentTenant, leavingDate, userEmail);
        showToast('Tenant deactivated successfully!');
        closeModal();
    } catch(e) {
        showToast('Failed to deactivate tenant.', 'error');
        console.error(e);
    }
  };
  
  const getTenantLocation = (tenant: Tenant) => {
    const hostel = data.hostels[tenant.hostelId]?.name || 'N/A';
    const room = Object.values(data.hostels)
      .flatMap(h => Object.values(h.floors))
      .flatMap(f => Object.values(f.rooms))
      .find(r => r.id === tenant.roomId)?.roomNumber || 'N/A';
    return `${hostel}, Room ${room}`;
  }

  const sortedTenants = useMemo(() => {
    return Object.values(data.tenants).sort((a, b) => {
      if (a.status === 'Active' && b.status === 'Inactive') return -1;
      if (a.status === 'Inactive' && b.status === 'Active') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data.tenants]);

  const renderModalContent = () => {
    if (modalMode === 'deactivate') {
        return (
            <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to deactivate {('name' in currentTenant) && currentTenant.name}? This will mark their room as vacant.
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Leaving Date</label>
                <input type="date" value={leavingDate} onChange={e => setLeavingDate(e.target.value)} className="mt-1 input-style" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            <input name="name" placeholder="Full Name" value={currentTenant.name} onChange={handleInputChange} className="input-style" />
            <input name="phone" placeholder="Phone Number" value={currentTenant.phone} onChange={handleInputChange} className="input-style" />
            <input name="email" type="email" placeholder="Email Address" value={currentTenant.email} onChange={handleInputChange} className="input-style" />
            <input name="checkInDate" type="date" value={currentTenant.checkInDate} onChange={handleInputChange} className="input-style" />
            <input name="rentAmount" type="number" placeholder="Rent Amount" value={currentTenant.rentAmount || ''} onChange={handleInputChange} className="input-style" />
            <input name="securityDeposit" type="number" placeholder="Security Deposit" value={currentTenant.securityDeposit || ''} onChange={handleInputChange} className="input-style" />
            <input name="aadharId" placeholder="Aadhar ID" value={currentTenant.aadharId} onChange={handleInputChange} className="input-style" />
            <textarea name="nativeAddress" placeholder="Native Address" value={currentTenant.nativeAddress} onChange={handleInputChange} className="input-style md:col-span-2" rows={3}></textarea>
            
            <select name="hostelId" value={currentTenant.hostelId} onChange={handleInputChange} className="input-style" disabled={modalMode === 'edit'}>
                <option value="">Select Hostel</option>
                {Object.values(data.hostels).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select name="floorId" value={currentTenant.floorId} onChange={handleInputChange} className="input-style" disabled={!selectedHostel || modalMode === 'edit'}>
                <option value="">Select Floor</option>
                {availableFloors.map(f => <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>)}
            </select>
            <select name="roomId" value={currentTenant.roomId} onChange={handleInputChange} className="input-style" disabled={!selectedFloor || modalMode === 'edit'}>
                <option value="">Select Room</option>
                 {('id' in currentTenant) && modalMode === 'edit' && (
                     <option value={currentTenant.roomId}>
                        {(() => {
                            const loc = getTenantLocation(currentTenant);
                            return loc.includes('Room ') ? `Room ${loc.split('Room ')[1]}` : loc;
                        })()}
                     </option>
                 )}
                {availableRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.capacity - r.tenantIds.length} beds left)</option>)}
            </select>
        </div>
    );
  };
  
  const renderModalFooter = () => {
      if (modalMode === 'deactivate') {
          return (
             <div className="flex justify-end gap-4 pt-6">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                <button onClick={handleDeactivateTenant} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirm Deactivation</button>
            </div>
          );
      }
      return (
        <div className="flex justify-end gap-4 pt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                {modalMode === 'add' ? 'Add Tenant' : 'Save Changes'}
            </button>
        </div>
      );
  }

  const modalTitle = {
      add: 'Add New Tenant',
      edit: 'Edit Tenant Details',
      deactivate: `Deactivate ${('name' in currentTenant) ? currentTenant.name : 'Tenant'}`
  };


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Tenant Management</h2>
          <button onClick={() => openModal('add')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex-shrink-0">Add New Tenant</button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-400">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Rent (₹)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTenants.map(tenant => (
                <tr key={tenant.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${tenant.status === 'Inactive' ? 'opacity-60' : ''}`}>
                  <td className="p-4 font-medium text-gray-800 dark:text-white">{tenant.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{tenant.phone}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{getTenantLocation(tenant)}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{tenant.rentAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${tenant.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{tenant.status}</span>
                  </td>
                   <td className="p-4 space-x-4">
                     <button onClick={() => openModal('edit', tenant)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium">View/Edit</button>
                     {tenant.status === 'Active' && (
                        <button onClick={() => openModal('deactivate', tenant)} className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium">Deactivate</button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {Object.keys(data.tenants).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tenants found. Click "Add New Tenant" to get started.
            </div>
          )}
        </div>
      </div>

      <Modal title={modalTitle[modalMode]} isOpen={isModalOpen} onClose={closeModal}>
        {renderModalContent()}
        {renderModalFooter()}
      </Modal>

      <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); color: #111827; } .dark .input-style { background-color: #1e293b; border-color: #4b5563; color: #f9fafb; } .input-style:focus { outline: none; box-shadow: 0 0 0 2px #3b82f6; border-color: #3b82f6; } .input-style:disabled { background-color: #f3f4f6; cursor: not-allowed; } .dark .input-style:disabled { background-color: #334155; }`}</style>
    </>
  );
};