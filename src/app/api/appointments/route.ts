// src/app/api/appointments/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { appointmentOperations } from '@/lib/dbOperations';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dru0vlphj',
  api_key: process.env.CLOUDINARY_API_KEY || '672287136335912',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'oD92DJkfMim_GjGS6OCuLkChvaQ',
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const decodedToken = verifyToken(token as string);

    if (!decodedToken) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = getUserById(decodedToken.userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();

    // Extract text fields
    const userId = formData.get('user_id') as string;
    const vetId = formData.get('vet_id') as string;
    const appointmentDatetime = formData.get('appointment_datetime') as string;
    const status = formData.get('status') as string;
    const reason = formData.get('reason') as string;

    // Validate required fields
    if (!userId || !vetId || !appointmentDatetime) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the user_id matches the authenticated user
    if (userId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle image uploads
    let imageUrls: string[] = [];
    const images = formData.getAll('images') as File[];

    if (images && images.length > 0) {
      // Upload images to Cloudinary
      for (const image of images) {
        if (image.size > 0) { // Only upload non-empty files
          try {
            const arrayBuffer = await image.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const result = await new Promise((resolve, reject) => {
              const stream = cloudinary.v2.uploader.upload_stream(
                {
                  resource_type: 'auto',
                  upload_preset: 'agropetvet' // Use the provided upload preset
                },
                (error, result) => {
                  if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );
              stream.end(buffer);
            });

            imageUrls.push((result as any).secure_url);
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            return Response.json({ error: 'Failed to upload images' }, { status: 500 });
          }
        }
      }
    }

    // Create the appointment with images and reason
    const newAppointment = appointmentOperations.create({
      user_id: userId,
      vet_id: vetId,
      appointment_datetime: appointmentDatetime,
      status: status || 'pending',
      reason: reason || null,
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      diagnosis: null, // Initially null, will be filled by vet later
      prescription: null, // Initially null, will be filled by vet later
      vet_comments: null // Initially null, will be filled by vet later
    });

    return Response.json({ appointment: newAppointment });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}