import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import { addCDInfoToHotelData } from "@/lib/cdUtils";
import { getAuth } from "@clerk/nextjs/server";

const DEFAULT_CD_DAYS = 30;

export async function POST(request) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "用户未认证。" }, { status: 401 });
  }

  if (!redis) {
    return NextResponse.json({ error: "Redis 客户端未初始化。请检查服务器日志。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { hotelName, checkInDate, customCD } = body;

    if (!hotelName || !checkInDate) {
      return NextResponse.json({ error: "酒店名称和入住日期为必填项。" }, { status: 400 });
    }

    const trimmedHotelName = hotelName.trim();
    if (!trimmedHotelName) {
        return NextResponse.json({ error: "酒店名称不能为空。" }, { status: 400 });
    }

    const userHotelsSetKey = `user:${userId}:hotels`;
    const hotelIds = await redis.smembers(userHotelsSetKey);

    if (hotelIds && hotelIds.length > 0) {
      for (const id of hotelIds) {
        const existingHotelKey = `user:${userId}:hotel:${id}`;
        const existingHotelName = await redis.hget(existingHotelKey, "hotelName");
        if (existingHotelName && existingHotelName.toLowerCase() === trimmedHotelName.toLowerCase()) {
          return NextResponse.json({ error: "错误：酒店名称已存在，请使用其他名称。" }, { status: 409 });
        }
      }
    }

    const hotelId = uuidv4();
    let newHotelEntry = {
      id: hotelId,
      userId: userId,
      hotelName: trimmedHotelName,
      checkInDate,
      customCD: customCD ? parseInt(customCD, 10) : null,
      defaultCD: DEFAULT_CD_DAYS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const hotelKey = `user:${userId}:hotel:${hotelId}`;
    await redis.hmset(hotelKey, newHotelEntry);

    await redis.sadd(userHotelsSetKey, hotelId);
    
    let hotelForResponse = { ...newHotelEntry };
    hotelForResponse = addCDInfoToHotelData(hotelForResponse);

    return NextResponse.json(hotelForResponse, { status: 201 });
  } catch (error) {
    console.error("添加酒店出错:", error);
    return NextResponse.json({ error: "未能添加酒店记录。", details: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "用户未认证。" }, { status: 401 });
  }

  if (!redis) {
    return NextResponse.json({ error: "Redis 客户端未初始化。请检查服务器日志。" }, { status: 500 });
  }

  try {
    const userHotelsSetKey = `user:${userId}:hotels`;
    const hotelIds = await redis.smembers(userHotelsSetKey);

    if (!hotelIds || hotelIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    let hotels = [];
    for (const hotelId of hotelIds) {
      const hotelKey = `user:${userId}:hotel:${hotelId}`;
      const hotelData = await redis.hgetall(hotelKey);
      if (hotelData) {
        if (hotelData.customCD && typeof hotelData.customCD === 'string') hotelData.customCD = parseInt(hotelData.customCD, 10); 
        else if (hotelData.customCD === undefined || hotelData.customCD === null || hotelData.customCD === 
'') hotelData.customCD = null;
        
        if (hotelData.defaultCD && typeof hotelData.defaultCD === 'string') hotelData.defaultCD = parseInt(hotelData.defaultCD, 10);
        else if (typeof hotelData.defaultCD !== 'number') hotelData.defaultCD = DEFAULT_CD_DAYS;
        
        hotelData.id = hotelData.id || hotelId;
        hotelData.userId = hotelData.userId || userId;
        
hotels.push(hotelData);
      }
    }
    
    let hotelsWithCDInfo = addCDInfoToHotelData(hotels.map(h => ({...h})));

    return NextResponse.json(hotelsWithCDInfo, { status: 200 });
  } catch (error) {
    console.error("获取酒店列表失败:", error);
    return NextResponse.json({ error: "未能获取酒店记录。", details: error.message }, { status: 500 });
  }
}

// Basic DELETE functionality (can be expanded)
export async function DELETE(request, { params }) {
    const { userId } = getAuth(request);
    if (!userId) {
        return NextResponse.json({ error: "用户未认证。" }, { status: 401 });
    }

    if (!redis) {
        return NextResponse.json({ error: "Redis 客户端未初始化。请检查服务器日志。" }, { status: 500 });
    }

    try {
        // Note: Next.js App Router passes dynamic route parameters differently.
        // We need to get the hotel ID from the request URL or body if not using `params` directly from a dynamic route file.
        // For this example, assuming the ID comes from a dynamic route like /api/hotels/[id]
        // If the ID is in the URL path, it should be handled by a specific [id]/route.js file.
        // If it's a general DELETE to /api/hotels, the ID might be in the query string or body.
        
        // This route.js is for /api/hotels. For /api/hotels/[id], a separate file is needed.
        // Let's assume for now the ID is passed in the URL search params for this general route for simplicity, or this function is moved to [id]/route.js
        const url = new URL(request.url);
        const hotelId = url.searchParams.get("id"); // Example: /api/hotels?id=some-id

        if (!hotelId) {
             // If this DELETE is meant for a specific hotel ID, and it's not provided, return an error.
             // This part of the code might be better placed in `src/app/api/hotels/[id]/route.js`
             // For now, let's assume the main page's handleDeleteHotel sends ID in URL or body.
             // The current frontend sends it as /api/hotels/${hotelId}
             // This means we need a dynamic route for DELETE.
            return NextResponse.json({ error: "酒店 ID 未提供。" }, { status: 400 });
        }

        const hotelKey = `user:${userId}:hotel:${hotelId}`;
        const userHotelsSetKey = `user:${userId}:hotels`;

        // Check if hotel exists and belongs to the user
        const exists = await redis.exists(hotelKey);
        if (!exists) {
            return NextResponse.json({ error: "酒店记录未找到或不属于当前用户。" }, { status: 404 });
        }

        await redis.del(hotelKey);
        await redis.srem(userHotelsSetKey, hotelId);

        return NextResponse.json({ message: "酒店记录已删除。" }, { status: 200 });
    } catch (error) {
        console.error("删除酒店出错:", error);
        return NextResponse.json({ error: "未能删除酒店记录。", details: error.message }, { status: 500 });
    }
}

