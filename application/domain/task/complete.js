/**
 * Mark a task as completed
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @returns {Promise<Object>} Updated task
 */
async (taskId, eventId) => {
  if (!taskId || !eventId) {
    throw new Error('taskId and eventId are required');
  }

  try {
    const query = `
      UPDATE "EventTask"
      SET status = 'completed', updated_at = now()
      WHERE id = $1 AND event_id = $2
      RETURNING *
    `;

    const result = await db.pg.query(query, [taskId, eventId]);

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};
