
import React, { useMemo } from 'react';
import { AppData, Room, Tenant } from '../types';

interface VacancyProps {
  data: AppData;
}

interface VacantRoomInfo {
  room: Room;
  hostelName: string;
  floorNumber: number;
  lastOccupant?: Tenant;
}

export const Vacancy: React.FC<VacancyProps> = ({ data }) => {
  const vacantRooms = useMemo<VacantRoomInfo[]>(() => {
    // Fix: Convert hostels, floors, and rooms objects to arrays to use flatMap and map
    const allRooms = Object.values(data.hostels).flatMap(hostel => 
        Object.values(hostel.floors).flatMap(floor => 
            Object.values(floor.rooms).map(room => ({
                room,
                hostelName: hostel.name,
                floorNumber: floor.floorNumber
            }))
        )
    );

    const vacant = allRooms.filter(({ room }) => room.tenantIds.length < room.capacity);

    return vacant.map(({ room, hostelName, floorNumber }) => {
        // Fix: Convert tenants object to array to filter
        const inactiveTenantsInRoom = Object.values(data.tenants).filter(tenant => 
            tenant.roomId === room.id && tenant.status === 'Inactive' && tenant.checkOutDate
        );
        
        const lastOccupant = inactiveTenantsInRoom.sort((a, b) => 
            new Date(b.checkOutDate!).getTime() - new Date(a.checkOutDate!).getTime()
        )[0];

        return { room, hostelName, floorNumber, lastOccupant };
    });
  }, [data]);

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Vacancy Overview</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-400">
              <tr>
                <th className="p-4">Hostel</th>
                <th className="p-4">Room / Floor</th>
                <th className="p-4">Occupancy</th>
                <th className="p-4">Last Rent (₹)</th>
                <th className="p-4">Last Occupant</th>
                <th className="p-4">Left On</th>
              </tr>
            </thead>
            <tbody>
              {vacantRooms.map(({ room, hostelName, floorNumber, lastOccupant }) => (
                <tr key={room.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 font-medium text-gray-800 dark:text-white">{hostelName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-800 dark:text-white">{room.roomNumber}</span> / F{floorNumber}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <span className="font-bold">{room.tenantIds.length}</span> / {room.capacity}
                  </td>
                   <td className="p-4 text-gray-600 dark:text-gray-300">
                    {lastOccupant ? lastOccupant.rentAmount.toLocaleString('en-IN') : 'N/A'}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{lastOccupant?.name || 'N/A'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {lastOccupant?.checkOutDate ? new Date(lastOccupant.checkOutDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {vacantRooms.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Congratulations! No vacant rooms found.
            </div>
          )}
        </div>
    </div>
  );
};
