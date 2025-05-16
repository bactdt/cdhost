import React, { useState } from 'react';

const AddHotelForm = ({ onHotelAdded }) => {
  const [hotelName, setHotelName] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [customCD, setCustomCD] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newHotel = {
      hotelName,
      checkInDate,
      // Send customCD as null if empty string, otherwise parse as integer
      customCD: customCD === '' ? null : parseInt(customCD, 10),
    };

    try {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHotel),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      // Clear form and trigger refetch
      setHotelName('');
      setCheckInDate('');
      setCustomCD('');
      if (onHotelAdded) {
        onHotelAdded();
      }
    } catch (err) {
      console.error('Failed to add hotel:', err);
      setError('Failed to add hotel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Add New Hotel</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">Hotel Name:</label>
          <input
            type="text"
            id="hotelName"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">Check-in Date:</label>
          <input
            type="date"
            id="checkInDate"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="customCD" className="block text-sm font-medium text-gray-700">Custom CD (Optional):</label>
          <input
            type="number"
            id="customCD"
            value={customCD}
            onChange={(e) => setCustomCD(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Hotel'}
        </button>
      </form>
    </div>
  );
};

export default AddHotelForm;