// src/app/api/profile/photo/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations } from '@/lib/dbOperations';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dru0vlphj',
  api_key: process.env.CLOUDINARY_API_KEY || '672287136335912',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'oD92DJkfMim_GjGS6OCuLkChvaQ',
});

export async function PUT(request: NextRequest) {
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
    
    // Extract the image file
    const imageFile = formData.get('profilePhoto') as File | null;
    
    if (!imageFile) {
      return Response.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Upload image to Cloudinary
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
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
        
        imageUrl = (result as any).secure_url;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return Response.json({ error: 'Failed to upload image' }, { status: 500 });
      }
    }

    // Update the user's profile with the new photo URL
    const updatedProfile = profileOperations.update(user.id, {
      profile_photo: imageUrl
    });

    if (!updatedProfile) {
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return Response.json({ profile: updatedProfile });
  } catch (error: any) {
    console.error('Error updating profile photo:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}