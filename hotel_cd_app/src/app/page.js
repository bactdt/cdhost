'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import HotelList from '../components/HotelList';
import AddHotelForm from '../components/AddHotelForm';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  const fetchHotels = async () => {
    if (!isSignedIn || !user?.id) {
      // If not signed in or no user ID, clear hotels and stop loading
      setHotels([]);
      setLoading(false);
      return;
    }

    setLoading(true); // Set loading before fetching
    setError(null); // Clear previous errors
    try {
      const res = await fetch('/api/hotels');
      if (!res.ok) {
        // Handle non-OK responses, e.g., 401, 500
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHotels(data);
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
      setError('Failed to load hotels. Please try again.'); // Set error message
      setHotels([]); // Clear hotels on error
    } finally {
      setLoading(false); // Always set loading to false after fetch attempt
    }
  };

  useEffect(() => {
    // Only fetch if Clerk is loaded AND user is signed in
    if (isLoaded && isSignedIn) {
      fetchHotels();
    } else if (isLoaded && !isSignedIn) {
      // If loaded but not signed in, clear hotels and stop loading
      setHotels([]);
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user?.id]); // Depend on isLoaded, isSignedIn, and userId

  const handleHotelAdded = () => {
    // After adding a hotel, refetch the list
    fetchHotels();
  };

  // Display loading or error state
  if (!isLoaded) {
    return <div>Loading user...</div>; // Show loading state while Clerk loads
  }

  if (loading) {
    return <div>Loading hotels...</div>; // Show loading state while fetching hotels
  }

  if (error) {
    return <div className="text-red-500">{error}</div>; // Show error message
  }

  // ... existing code ...
}

