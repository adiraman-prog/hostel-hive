// services/storageService.ts -> now firebaseService.ts
import { app } from '../firebaseConfig';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { AppData, Hostel, Tenant, Payment, Floor, Room, ReportHistoryItem } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// The entire app's data is stored in a single document for simplicity.
// For larger scale apps, consider splitting into multiple documents/collections.
const dataDocRef = doc(db, 'hostel-data', 'main');

const listenToData = (callback: (data: AppData | null) => void): (() => void) => {
    return onSnapshot(dataDocRef, (doc) => {
        callback(doc.exists() ? doc.data() as AppData : null);
    });
};

const saveInitialDataStructure = async (userEmail: string) => {
    const initialData: AppData = {
        hostels: {},
        tenants: {},
        payments: {},
        reportHistory: {},
        auditLogs: [{
            id: `log-${Date.now()}`,
            user: userEmail,
            action: 'Initialized the database.',
            timestamp: new Date().toISOString()
        }]
    };
    await setDoc(dataDocRef, initialData);
};


const logAction = async (action: string, user: string) => {
    const logEntry = {
        id: `log-${Date.now()}`,
        user,
        action,
        timestamp: new Date().toISOString()
    };
    await updateDoc(dataDocRef, {
        auditLogs: arrayUnion(logEntry)
    });
};

// --- Auth Functions ---
// Switched to Popup for better handling in preview environments
const signInWithGoogle = () => signInWithPopup(auth, provider);
const signOut = () => firebaseSignOut(auth);
const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};


// --- Data Mutation Functions ---

const addHostel = async (hostel: Omit<Hostel, 'id' | 'floors' | 'lastModifiedAt' | 'lastModifiedBy'>, userEmail: string) => {
    const id = `h-${Date.now()}`;
    const newHostel: Hostel = {
        ...hostel,
        id,
        floors: {},
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: userEmail,
    };
    await updateDoc(dataDocRef, { [`hostels.${id}`]: newHostel });
    await logAction(`Added new hostel: ${hostel.name}`, userEmail);
};

const addFloor = async (floor: Omit<Floor, 'id' | 'rooms' | 'lastModifiedAt' | 'lastModifiedBy'>, userEmail: string) => {
    const id = `f-${Date.now()}`;
    const newFloor: Floor = {
        ...floor,
        id,
        rooms: {},
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: userEmail,
    };
    await updateDoc(dataDocRef, { [`hostels.${floor.hostelId}.floors.${id}`]: newFloor });
    await logAction(`Added Floor ${floor.floorNumber} to hostel ID ${floor.hostelId}`, userEmail);
};

const addRoom = async (room: Omit<Room, 'id' | 'tenantIds' | 'lastModifiedAt' | 'lastModifiedBy'>, userEmail: string) => {
    const id = `r-${Date.now()}`;
    const newRoom: Room = {
        ...room,
        id,
        tenantIds: [],
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: userEmail,
    };
    await updateDoc(dataDocRef, { [`hostels.${room.hostelId}.floors.${room.floorId}.rooms.${id}`]: newRoom });
    await logAction(`Added Room ${room.roomNumber} to floor ID ${room.floorId}`, userEmail);
};

const addTenant = async (tenant: Omit<Tenant, 'id' | 'lastModifiedAt' | 'lastModifiedBy'>, userEmail: string) => {
    const id = `t-${Date.now()}`;
    const newTenant: Tenant = {
        ...tenant,
        id,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: userEmail,
    };
    await updateDoc(dataDocRef, { 
        [`tenants.${id}`]: newTenant,
        [`hostels.${tenant.hostelId}.floors.${tenant.floorId}.rooms.${tenant.roomId}.tenantIds`]: arrayUnion(id)
    });
    await logAction(`Added new tenant: ${tenant.name}`, userEmail);
};

const updateTenant = async (tenant: Tenant, userEmail: string) => {
    const updatedTenant: Tenant = {
        ...tenant,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: userEmail,
    };
     await updateDoc(dataDocRef, { [`tenants.${tenant.id}`]: updatedTenant });
     await logAction(`Updated details for tenant: ${tenant.name}`, userEmail);
};


const deactivateTenant = async (tenant: Tenant, checkOutDate: string, userEmail: string) => {
    const path_to_tenant_ids = `hostels.${tenant.hostelId}.floors.${tenant.floorId}.rooms.${tenant.roomId}.tenantIds`;
    
    const updatePayload: any = {
        [`tenants.${tenant.id}.status`]: 'Inactive',
        [`tenants.${tenant.id}.checkOutDate`]: checkOutDate,
        [`tenants.${tenant.id}.lastModifiedAt`]: new Date().toISOString(),
        [`tenants.${tenant.id}.lastModifiedBy`]: userEmail,
        [path_to_tenant_ids]: arrayRemove(tenant.id)
    };

    await updateDoc(dataDocRef, updatePayload);
    await logAction(`Deactivated tenant: ${tenant.name}`, userEmail);
};


const recordPayment = async (payment: Omit<Payment, 'id' | 'lastModifiedAt' | 'lastModifiedBy'>, userEmail: string) => {
    const id = `p-${Date.now()}`;
    const newPayment: Payment = {
        ...payment,
        id,
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: userEmail,
    };
    await updateDoc(dataDocRef, { [`payments.${id}`]: newPayment });
    await logAction(`Recorded payment of ${payment.amount} for tenant ID ${payment.tenantId}`, userEmail);
};

const addReportToHistory = async (item: { query: string, report: string }, userEmail: string) => {
    const id = `rep-${Date.now()}`;
    const newReportHistoryItem: ReportHistoryItem = {
        id,
        user: userEmail,
        query: item.query,
        report: item.report,
        timestamp: new Date().toISOString(),
    };
    // Use setDoc with merge to ensure reportHistory map exists, handling backward compatibility
    await setDoc(dataDocRef, { reportHistory: { [id]: newReportHistoryItem } }, { merge: true });
    await logAction(`Generated AI report for query: "${item.query}"`, userEmail);
};


export const dataService = {
  listenToData,
  saveInitialDataStructure,
  onAuthStateChanged: onAuthChange,
  signInWithGoogle,
  signOut,
  addHostel,
  addFloor,
  addRoom,
  addTenant,
  updateTenant,
  deactivateTenant,
  recordPayment,
  addReportToHistory
};