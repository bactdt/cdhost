import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export function getAuth(request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      throw new Error('用户未认证');
    }
    
    return { userId };
  } catch (error) {
    console.error('认证错误:', error);
    return { error: error.message };
  }
}