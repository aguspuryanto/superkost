import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

interface Kost {
  id: string;
  name: string;
  address: string;
  description: string;
  rooms: Room[];
}

interface Room {
  id: string;
  name: string;
  price: number;
  status: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { notifications, markAsRead } = useSocket();
  const [kosts, setKosts] = useState<Kost[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/kosts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKosts(data);
        } else {
          console.error('Failed to fetch kosts:', data);
          setKosts([]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 flex justify-between items-center relative">
        <h1 className="text-xl font-bold">SuperKost Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2">
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50 border">
                <div className="p-3 bg-gray-50 border-b font-semibold">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-3 border-b hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`} onClick={() => markAsRead(n.id)}>
                        <h4 className="font-semibold text-sm">{n.title}</h4>
                        <p className="text-xs text-gray-600">{n.message}</p>
                        <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <span>Welcome, {user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
        </div>
      </nav>

      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Available Kosts</h2>
          <div className="flex gap-2">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'KOST_ADMIN' || user?.role === 'STAFF') && (
              <button onClick={() => navigate('/onboarding')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Onboard Tenant
              </button>
            )}
            {user?.role === 'SUPER_ADMIN' && (
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Add New Kost
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kosts.map((kost) => (
            <div key={kost.id} className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-bold mb-2">{kost.name}</h3>
              <p className="text-gray-600 mb-4">{kost.address}</p>
              <p className="text-sm text-gray-500 mb-4">{kost.description}</p>
              
              <h4 className="font-bold mb-2">Rooms:</h4>
              <ul className="space-y-2">
                {kost.rooms?.map((room) => (
                  <li key={room.id} className="flex justify-between items-center border-b pb-1">
                    <span>{room.name}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      room.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {room.status}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 flex justify-end">
                 <button className="text-blue-500 hover:underline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
