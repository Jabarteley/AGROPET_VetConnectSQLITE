import { NextRequest } from 'next/server';
import { vetScheduleOperations } from '@/lib/dbOperations';

export async function GET(request: NextRequest, { params }: { params: { vetId: string } }) {
  try {
    const { vetId } = params;

    // Validate the vetId
    if (!vetId || typeof vetId !== 'string' || vetId.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid veterinarian ID.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the veterinarian's schedule using db operations
    const schedule = vetScheduleOperations.getByVetId(vetId);

    return new Response(JSON.stringify({
      success: true,
      schedule: schedule
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching veterinarian schedule:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { vetId: string } }) {
  try {
    const { vetId } = params;
    const { schedule } = await request.json();

    // Validate the vetId
    if (!vetId || typeof vetId !== 'string' || vetId.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid veterinarian ID.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate the schedule data
    if (!Array.isArray(schedule)) {
      return new Response(JSON.stringify({ error: 'Schedule must be an array of day schedules.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate each schedule entry
    for (const daySchedule of schedule) {
      if (
        typeof daySchedule.day_of_week !== 'number' ||
        daySchedule.day_of_week < 0 ||
        daySchedule.day_of_week > 6 ||
        typeof daySchedule.start_time !== 'string' ||
        typeof daySchedule.end_time !== 'string' ||
        typeof daySchedule.is_available !== 'boolean'
      ) {
        return new Response(JSON.stringify({ error: 'Invalid schedule data format.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Basic time validation (HH:MM format)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(daySchedule.start_time) || !timeRegex.test(daySchedule.end_time)) {
        return new Response(JSON.stringify({ error: 'Time format must be HH:MM (24-hour format).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Update the veterinarian's schedule using db operations
    const updatedSchedule = vetScheduleOperations.upsertForVet(vetId, schedule);

    return new Response(JSON.stringify({
      success: true,
      schedule: updatedSchedule
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating veterinarian schedule:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}