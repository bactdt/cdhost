import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import { addCDInfoToHotelData } from "@/lib/cdUtils";
import { getAuth } from "@clerk/nextjs/server";

const DEFAULT_CD_DAYS = 30;

async function POST(request) {
  const { userId } = await getAuth(request);
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

async function GET(request) {
  const { userId } = await getAuth(request);
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
        else if (hotelData.customCD === undefined || hotelData.customCD === null || hotelData.customCD === '') hotelData.customCD = null;
        
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

async function DELETE(request, { params }) {
  if (!redis) {
      return NextResponse.json({ error: "Redis 客户端未初始化。请检查服务器日志。" }, { status: 500 });
  }

  try {
      const { userId } = await getAuth(request);
      if (!userId) {
          return NextResponse.json({ error: "用户未认证。" }, { status: 401 });
      }

      // 修复：先 await params 再访问 id
      const { id } = await params;
      const hotelId = id;
      
      if (!hotelId) {
          return NextResponse.json({ error: "酒店 ID 未提供。" }, { status: 400 });
      }

      const hotelKey = `user:${userId}:hotel:${hotelId}`;
      const userHotelsSetKey = `user:${userId}:hotels`;

      // 剩余代码保持不变...
      const exists = await redis.exists(hotelKey);
      if (!exists) {
          return NextResponse.json({ error: "酒店记录未找到。" }, { status: 404 });
      }

      await redis.del(hotelKey);
      await redis.srem(userHotelsSetKey, hotelId);

      return NextResponse.json({ message: "酒店记录已删除。" }, { status: 200 });
  } catch (error) {
      console.error("删除酒店出错:", error);
      return NextResponse.json({ error: "未能删除酒店记录。", details: error.message }, { status: 500 });
  }
}


export { POST, GET , DELETE};
