import React from 'react';

const HotelList = ({ hotels, onEdit, onDelete }) => {
  if (!hotels || hotels.length === 0) {
    return <p>No hotels added yet.</p>;
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Hotel List</h2>
      <ul>
        {hotels.map(hotel => (
          <li key={hotel.id} className="border p-2 mb-2 rounded">
            <p><strong>Name:</strong> {hotel.hotelName}</p>
            <p><strong>Check-in Date:</strong> {hotel.checkInDate}</p>
            {hotel.customCD !== null && <p><strong>Custom CD:</strong> {hotel.customCD}</p>}
            {hotel.defaultCD !== null && <p><strong>Default CD:</strong> {hotel.defaultCD}</p>}
            {hotel.calculatedCD !== null && <p><strong>Calculated CD:</strong> {hotel.calculatedCD}</p>}
            <button onClick={() => onEdit(hotel)} className="mr-2 text-blue-500">Edit</button>
            <button onClick={() => onDelete(hotel.id)} className="text-red-500">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HotelList;