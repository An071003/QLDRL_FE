import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/api/activities/${id}/reject`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error rejecting activity:', error);
    
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'Error rejecting activity' 
      },
      { 
        status: error.response?.status || 500 
      }
    );
  }
}