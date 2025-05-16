import { NextResponse } from "next/server";
import redis from "@/lib/redis"; // Assuming @ is configured for src path alias
import { getAuth } from "@clerk/nextjs/server";

/**
 * Handles PUT request to update a hotel entry.
 * @param {Request} request
 * @param {{ params: { id: string } }} context
 */
export async function PUT(request, { params }) {
  if (!redis) {
    return NextResponse.json({ error: "Redis client not initialized. Check server logs." }, { status: 500 });
  }

  const hotelId = params.id;
  if (!hotelId) {
    return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { hotelName, checkInDate, customCD } = body;

    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "用户未认证" }, { status: 401 });
    }
    const hotelKey = `user:${userId}:hotel:${hotelId}`;

    // Check if hotel entry exists
    const exists = await redis.exists(hotelKey);
    if (!exists) {
      return NextResponse.json({ error: "Hotel entry not found" }, { status: 404 });
    }

    const updates = {};
    if (hotelName !== undefined) updates.hotelName = hotelName;
    if (checkInDate !== undefined) updates.checkInDate = checkInDate;
    if (customCD !== undefined) updates.customCD = customCD === null ? null : parseInt(customCD, 10);
    updates.updatedAt = new Date().toISOString();

    if (Object.keys(updates).length === 1 && updates.updatedAt) { // Only updatedAt means no actual data changed
        // Optionally, still update updatedAt or return 304 Not Modified
        await redis.hset(hotelKey, { updatedAt: updates.updatedAt });
        const updatedHotelEntry = await redis.hgetall(hotelKey);
        if (updatedHotelEntry.customCD) updatedHotelEntry.customCD = parseInt(updatedHotelEntry.customCD, 10);
        if (updatedHotelEntry.defaultCD) updatedHotelEntry.defaultCD = parseInt(updatedHotelEntry.defaultCD, 10);
        return NextResponse.json(updatedHotelEntry, { status: 200 });
    }
    
    if (Object.keys(updates).length > 1) { // if there are actual updates beyond just updatedAt
        await redis.hmset(hotelKey, updates);
    }

    const updatedHotelEntry = await redis.hgetall(hotelKey);
    // Ensure numeric types are correct after retrieval
    if (updatedHotelEntry.customCD) updatedHotelEntry.customCD = parseInt(updatedHotelEntry.customCD, 10);
    if (updatedHotelEntry.defaultCD) updatedHotelEntry.defaultCD = parseInt(updatedHotelEntry.defaultCD, 10);

    return NextResponse.json(updatedHotelEntry, { status: 200 });
  } catch (error) {
    console.error(`Error updating hotel ${hotelId}:`, error);
    return NextResponse.json({ error: "Failed to update hotel entry", details: error.message }, { status: 500 });
  }
}

/**
 * Handles DELETE request to remove a hotel entry.
 * @param {Request} request
 * @param {{ params: { id: string } }} context
 */
export async function DELETE(request, { params }) {
  if (!redis) {
    return NextResponse.json({ error: "Redis client not initialized. Check server logs." }, { status: 500 });
  }

  const hotelId = params.id;
  if (!hotelId) {
    return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 });
  }

  try {
    const auth = await getAuth(request);
    const { userId } = auth;
    
    if (!userId) {
      return NextResponse.json({ error: "用户未认证" }, { status: 401 });
    }

    const hotelKey = `user:${userId}:hotel:${hotelId}`;
    const userHotelsSetKey = `user:${userId}:hotels`;

    // 检查酒店条目是否存在
    const exists = await redis.exists(hotelKey);
    if (!exists) {
      return NextResponse.json({ error: "Hotel entry not found" }, { status: 404 });
    }

    // 删除酒店哈希
    await redis.del(hotelKey);

    // 从用户的酒店集合中移除酒店 ID
    await redis.srem(userHotelsSetKey, hotelId);

    return NextResponse.json({ message: "Hotel entry deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting hotel ${hotelId}:`, error);
    return NextResponse.json({ error: "Failed to delete hotel entry", details: error.message }, { status: 500 });
  }
}
