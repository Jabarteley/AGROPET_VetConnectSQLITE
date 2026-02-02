import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: { vetId: string } }) {
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

    // Begin transaction to ensure data consistency
    db.exec('BEGIN TRANSACTION');

    try {
      // Delete existing schedule for this vet
      const deleteStmt = db.prepare('DELETE FROM veterinarian_schedules WHERE vet_id = ?');
      deleteStmt.run(vetId);

      // Insert new schedule
      const insertStmt = db.prepare(`
        INSERT INTO veterinarian_schedules (id, vet_id, day_of_week, start_time, end_time, is_available, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      for (const daySchedule of schedule) {
        insertStmt.run(
          uuidv4(),
          vetId,
          daySchedule.day_of_week,
          daySchedule.start_time,
          daySchedule.end_time,
          daySchedule.is_available ? 1 : 0
        );
      }

      // Commit the transaction
      db.exec('COMMIT');

      // Return the updated schedule
      const selectStmt = db.prepare(`
        SELECT id, vet_id, day_of_week, start_time, end_time, is_available, created_at, updated_at
        FROM veterinarian_schedules
        WHERE vet_id = ?
        ORDER BY day_of_week ASC
      `);
      
      const updatedSchedule = selectStmt.all(vetId);

      return new Response(JSON.stringify({
        success: true,
        schedule: updatedSchedule
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (transactionError) {
      // Rollback the transaction in case of error
      db.exec('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error updating veterinarian schedule:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}