import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
// import prisma from '@/lib/prisma'; // 看起来这个项目主要使用 Redis
import redis from '@/lib/redis'; // 引入 redis 客户端
import { addCDInfoToHotelData } from '@/lib/cdUtils'; // 引入 CD 计算工具

// Mock user ID for development if needed, but prefer Clerk's userId
// const MOCK_USER_ID = 'user_2a1b2c3d4e5f678901234567890abcde'; 

export async function PUT(request, { params }) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 检查 Redis 客户端是否已初始化
  if (!redis) {
    console.error("Redis client is not initialized. Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.");
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const hotelId = params.id;
  if (!hotelId) {
    return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { hotelName, checkInDate, customCD } = body;

    const hotelKey = `user:${userId}:hotel:${hotelId}`; // Use Clerk's userId

    // Check if hotel entry exists and belongs to the user
    const exists = await redis.exists(hotelKey);
    if (!exists) {
      // Return 404 if not found, or 403 if found but doesn't belong to user (more complex check needed)
      return NextResponse.json({ error: "Hotel entry not found or does not belong to user" }, { status: 404 });
    }

    const updates = {};
    if (hotelName !== undefined) updates.hotelName = hotelName.trim(); // Trim whitespace
    if (checkInDate !== undefined) updates.checkInDate = checkInDate;
    // Handle customCD: store null if empty string, parse as int otherwise
    if (customCD !== undefined) {
        updates.customCD = customCD === null || customCD === '' ? null : parseInt(customCD, 10);
    }
    updates.updatedAt = new Date().toISOString();

    // Check if there are actual data updates beyond just updatedAt
    const hasDataUpdates = Object.keys(updates).some(key => key !== 'updatedAt');

    if (hasDataUpdates) {
        await redis.hmset(hotelKey, updates);
    } else {
         // If only updatedAt is being set (or no changes), still update updatedAt
         await redis.hset(hotelKey, { updatedAt: updates.updatedAt });
    }


    const updatedHotelEntry = await redis.hgetall(hotelKey);
    // Ensure numeric types are correct after retrieval
    if (updatedHotelEntry.customCD) updatedHotelEntry.customCD = parseInt(updatedHotelEntry.customCD, 10);
    if (updatedHotelEntry.defaultCD) updatedHotelEntry.defaultCD = parseInt(updatedHotelEntry.defaultCD, 10);


    // Add CD info before returning
    const hotelWithCDInfo = addCDInfoToHotelData({ id: hotelId, ...updatedHotelEntry });


    return NextResponse.json(hotelWithCDInfo, { status: 200 });
  } catch (error) {
    console.error(`Error updating hotel ${hotelId} for user ${userId}:`, error);
    return NextResponse.json({ error: "Failed to update hotel entry", details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 检查 Redis 客户端是否已初始化
  if (!redis) {
    console.error("Redis client is not initialized. Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.");
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const hotelId = params.id;
  if (!hotelId) {
    return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 });
  }

  try {
    const hotelKey = `user:${userId}:hotel:${hotelId}`; // Use Clerk's userId

    // Check if hotel entry exists and belongs to the user before deleting
    const exists = await redis.exists(hotelKey);
    if (!exists) {
       return NextResponse.json({ error: "Hotel entry not found or does not belong to user" }, { status: 404 });
    }

    const result = await redis.del(hotelKey);

    if (result === 1) { // Redis DEL command returns the number of keys removed
      return NextResponse.json({ message: 'Hotel entry deleted successfully' }, { status: 200 });
    } else {
      // This case should ideally not be reached if exists check passed, but good for robustness
      return NextResponse.json({ error: 'Failed to delete hotel entry' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Error deleting hotel ${hotelId} for user ${userId}:`, error);
    return NextResponse.json({ error: "Failed to delete hotel entry", details: error.message }, { status: 500 });
  }
}

