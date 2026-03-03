import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    roomId: '',
    startDate: '',
    endDate: '',
    totalAmount: 0,
    agreementContent: 'I hereby agree to the terms and conditions of SuperKost...',
  });

  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch available rooms (simplified: fetching all rooms from first kost)
    fetch('/api/kosts')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setRooms(data[0].rooms.filter((r: any) => r.status === 'AVAILABLE'));
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tenants/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to onboard tenant');

      alert('Tenant onboarded successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'KOST_ADMIN' && user?.role !== 'STAFF') {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Tenant Onboarding (Step {step}/4)</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

        {step === 1 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <input name="name" placeholder="Full Name" className="p-2 border rounded" onChange={handleChange} value={formData.name} />
              <input name="email" placeholder="Email" type="email" className="p-2 border rounded" onChange={handleChange} value={formData.email} />
              <input name="phone" placeholder="Phone" className="p-2 border rounded" onChange={handleChange} value={formData.phone} />
              <input name="password" placeholder="Temporary Password" type="password" className="p-2 border rounded" onChange={handleChange} value={formData.password} />
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 gap-4">
              <input name="emergencyName" placeholder="Contact Name" className="p-2 border rounded" onChange={handleChange} value={formData.emergencyName} />
              <input name="emergencyRelation" placeholder="Relation (e.g. Parent)" className="p-2 border rounded" onChange={handleChange} value={formData.emergencyRelation} />
              <input name="emergencyPhone" placeholder="Contact Phone" className="p-2 border rounded" onChange={handleChange} value={formData.emergencyPhone} />
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={handleBack} className="bg-gray-300 px-4 py-2 rounded">Back</button>
              <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <select name="roomId" className="p-2 border rounded" onChange={handleChange} value={formData.roomId}>
                <option value="">Select Room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} - ${r.price}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Start Date</label>
                  <input name="startDate" type="date" className="p-2 border rounded w-full" onChange={handleChange} value={formData.startDate} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">End Date</label>
                  <input name="endDate" type="date" className="p-2 border rounded w-full" onChange={handleChange} value={formData.endDate} />
                </div>
              </div>
              <input name="totalAmount" type="number" placeholder="Total Amount" className="p-2 border rounded" onChange={handleChange} value={formData.totalAmount} />
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={handleBack} className="bg-gray-300 px-4 py-2 rounded">Back</button>
              <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded">Next</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Rental Agreement & Confirm</h3>
            <textarea name="agreementContent" className="w-full h-40 p-2 border rounded mb-4" onChange={handleChange} value={formData.agreementContent} />
            
            <div className="bg-yellow-50 p-4 rounded mb-4">
              <p className="text-sm text-yellow-800">By clicking "Onboard Tenant", an account will be created, the room booked, and an invoice generated.</p>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={handleBack} className="bg-gray-300 px-4 py-2 rounded">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">
                {loading ? 'Processing...' : 'Onboard Tenant'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
