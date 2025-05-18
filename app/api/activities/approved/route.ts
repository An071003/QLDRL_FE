import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/activities/approved`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching approved activities:', error);
    
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'Error fetching approved activities' 
      },
      { 
        status: error.response?.status || 500 
      }
    );
  }
} 