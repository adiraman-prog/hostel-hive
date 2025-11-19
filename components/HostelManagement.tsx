
import React, { useState, useMemo } from 'react';
import { AppData, Hostel, Floor, Room } from '../types';
// Fix: Use dataService instead of non-existent storageService
import { dataService } from '../services/storageService';
import { Modal } from './common/Modal';
import type { User } from 'firebase/auth';

const FloorAccordion: React.FC<{
  floor: Floor;
  onAddRoom: (hostelId: string, floorId: string) => void;
}> = ({ floor, onAddRoom }) => {
    const [isExpanded, setExpanded] = useState(false);
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!isExpanded)}>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200">Floor {floor.floorNumber}</h4>
          <div className="flex items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); onAddRoom(floor.hostelId, floor.id); }} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
              Add Room
            </button>
            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        {isExpanded && (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
              {/* Fix: Convert rooms object to array to sort and map */}
              {Object.values(floor.rooms).sort((a,b) => a.roomNumber.localeCompare(b.roomNumber)).map(room => (
                <div key={room.id} className="border dark:border-gray-600 rounded p-2 text-center bg-white dark:bg-gray-800">
                  <p className="font-medium text-gray-800 dark:text-white">{room.roomNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{room.tenantIds.length} / {room.capacity}</p>
                </div>
              ))}
              {/* Fix: Use Object.keys to get length of rooms object */}
              {Object.keys(floor.rooms).length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400 col-span-full">No rooms on this floor.</p>}
            </div>
        )}
      </div>
    );
};


const HostelCard: React.FC<{
  hostel: Hostel;
  data: AppData;
  onAddFloor: (hostelId: string) => void;
  onAddRoom: (hostelId: string, floorId: string) => void;
}> = ({ hostel, data, onAddFloor, onAddRoom }) => {
  const stats = useMemo(() => {
    // Fix: Convert floors and rooms objects to arrays to use flatMap and reduce
    const rooms = Object.values(hostel.floors).flatMap(f => Object.values(f.rooms));
    const totalCapacity = rooms.reduce((acc, room) => acc + room.capacity, 0);
    const totalTenants = rooms.reduce((acc, room) => acc + room.tenantIds.length, 0);
    const occupancy = totalCapacity > 0 ? ((totalTenants / totalCapacity) * 100).toFixed(1) + '%' : '0%';
    return {
      // Fix: Use Object.keys to get length of floors object
      floors: Object.keys(hostel.floors).length,
      rooms: rooms.length,
      capacity: totalCapacity,
      tenants: totalTenants,
      occupancy,
    };
  }, [hostel, data.tenants]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{hostel.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{hostel.address}</p>
        </div>
        <button onClick={() => onAddFloor(hostel.id)} className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800">
          Add Floor
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-center">
        <div><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.floors}</p><p className="text-xs text-gray-500 dark:text-gray-400">Floors</p></div>
        <div><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.rooms}</p><p className="text-xs text-gray-500 dark:text-gray-400">Rooms</p></div>
        <div><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.tenants}</p><p className="text-xs text-gray-500 dark:text-gray-400">Tenants</p></div>
        <div><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.capacity}</p><p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p></div>
        <div><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.occupancy}</p><p className="text-xs text-gray-500 dark:text-gray-400">Occupancy</p></div>
      </div>
      <div className="mt-6 space-y-4">
        {/* Fix: Convert floors object to array to sort and map */}
        {Object.values(hostel.floors).sort((a,b) => a.floorNumber - b.floorNumber).map(floor => (
          <FloorAccordion key={floor.id} floor={floor} onAddRoom={onAddRoom} />
        ))}
        {/* Fix: Use Object.keys to get length of floors object */}
        {Object.keys(hostel.floors).length === 0 && <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No floors added yet.</p>}
      </div>
    </div>
  );
};

// Fix: Update component props interface
interface HostelManagementProps {
  data: AppData;
  showToast: (message: string, type?: 'success' | 'error') => void;
  user: User;
}

export const HostelManagement: React.FC<HostelManagementProps> = ({ data, showToast, user }) => {
  const [isAddHostelModalOpen, setAddHostelModalOpen] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', address: '' });

  const [isAddFloorModalOpen, setAddFloorModalOpen] = useState(false);
  const [newFloor, setNewFloor] = useState({ hostelId: '', floorNumber: '' });
  
  const [isAddRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ hostelId: '', floorId: '', roomNumber: '', capacity: '' });

  const userEmail = user?.email || 'unknown-user';

  const handleHostelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewHostel({ ...newHostel, [e.target.name]: e.target.value });
  };
  
  // Fix: Refactor to use async dataService method for adding a hostel
  const handleAddHostel = async () => {
    if (!newHostel.name || !newHostel.address) {
      showToast('Name and address are required.', 'error');
      return;
    }
    try {
        await dataService.addHostel({ name: newHostel.name, address: newHostel.address }, userEmail);
        showToast('Hostel added successfully!');
        setAddHostelModalOpen(false);
        setNewHostel({ name: '', address: '' });
    } catch (e) {
        showToast('Failed to add hostel.', 'error');
        console.error(e);
    }
  };
  
  const handleOpenAddFloorModal = (hostelId: string) => {
    const hostel = data.hostels[hostelId];
    if (!hostel) return;
    const floorCount = Object.keys(hostel.floors).length;
    // Fix: Correctly calculate next floor number from object values
    const nextFloorNumber = floorCount > 0 ? Math.max(...Object.values(hostel.floors).map(f => f.floorNumber)) + 1 : 1;
    setNewFloor({ hostelId, floorNumber: String(nextFloorNumber) });
    setAddFloorModalOpen(true);
  };

  // Fix: Refactor to use async dataService method for adding a floor
  const handleAddFloor = async () => {
    if (!newFloor.hostelId || !newFloor.floorNumber) {
        showToast('Floor number is required.', 'error');
        return;
    }
    try {
        await dataService.addFloor({ hostelId: newFloor.hostelId, floorNumber: Number(newFloor.floorNumber) }, userEmail);
        showToast('Floor added successfully!');
        setAddFloorModalOpen(false);
    } catch(e) {
        showToast('Failed to add floor.', 'error');
        console.error(e);
    }
  };

  const handleOpenAddRoomModal = (hostelId: string, floorId: string) => {
    setNewRoom({ hostelId, floorId, roomNumber: '', capacity: '2' });
    setAddRoomModalOpen(true);
  };
  
  // Fix: Refactor to use async dataService method for adding a room
  const handleAddRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.capacity) {
        showToast('Room number and capacity are required.', 'error');
        return;
    }
    try {
        await dataService.addRoom({ 
            hostelId: newRoom.hostelId, 
            floorId: newRoom.floorId,
            roomNumber: newRoom.roomNumber,
            capacity: Number(newRoom.capacity)
        }, userEmail);
        showToast('Room added successfully!');
        setAddRoomModalOpen(false);
    } catch (e) {
        showToast('Failed to add room.', 'error');
        console.error(e);
    }
  };


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Hostel Management</h2>
          <button onClick={() => setAddHostelModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex-shrink-0">Add New Hostel</button>
        </div>

        <div className="space-y-6">
          {/* Fix: Convert hostels object to array to map over it */}
          {Object.values(data.hostels).map(hostel => (
            <HostelCard key={hostel.id} hostel={hostel} data={data} onAddFloor={handleOpenAddFloorModal} onAddRoom={handleOpenAddRoomModal} />
          ))}
          {/* Fix: Use Object.keys to check length of hostels object */}
          {Object.keys(data.hostels).length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-gray-500 dark:text-gray-400">No hostels found.</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Click "Add New Hostel" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Hostel Modal */}
      <Modal title="Add New Hostel" isOpen={isAddHostelModalOpen} onClose={() => setAddHostelModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hostel Name</label>
            <input type="text" name="name" value={newHostel.name} onChange={handleHostelInputChange} className="mt-1 input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <input type="text" name="address" value={newHostel.address} onChange={handleHostelInputChange} className="mt-1 input-style" />
          </div>
        </div>
        <div className="flex justify-end gap-4 pt-6">
            <button onClick={() => setAddHostelModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleAddHostel} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Hostel</button>
        </div>
      </Modal>

      {/* Add Floor Modal */}
      <Modal title="Add New Floor" isOpen={isAddFloorModalOpen} onClose={() => setAddFloorModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Floor Number</label>
            <input type="number" value={newFloor.floorNumber} onChange={e => setNewFloor({...newFloor, floorNumber: e.target.value})} className="mt-1 input-style" />
          </div>
        </div>
        <div className="flex justify-end gap-4 pt-6">
            <button onClick={() => setAddFloorModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleAddFloor} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Floor</button>
        </div>
      </Modal>

       {/* Add Room Modal */}
      <Modal title="Add New Room" isOpen={isAddRoomModalOpen} onClose={() => setAddRoomModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Number</label>
            <input type="text" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} className="mt-1 input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
            <input type="number" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} className="mt-1 input-style" />
          </div>
        </div>
        <div className="flex justify-end gap-4 pt-6">
            <button onClick={() => setAddRoomModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={handleAddRoom} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Room</button>
        </div>
      </Modal>
      <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); color: #111827; } .dark .input-style { background-color: #1e293b; border-color: #4b5563; color: #f9fafb; } .input-style:focus { outline: none; box-shadow: 0 0 0 2px #3b82f6; border-color: #3b82f6; }`}</style>
    </>
  );
};