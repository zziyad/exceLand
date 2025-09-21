/**
 * Delete a task
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @returns {Promise<boolean>} Success status
 */
async (taskId, eventId) => {
  if (!taskId || !eventId) {
    throw new Error('taskId and eventId are required');
  }

  try {
    const query = `
      DELETE FROM "EventTask"
      WHERE id = $1 AND event_id = $2
      RETURNING id
    `;

    const result = await db.pg.query(query, [taskId, eventId]);

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete multiple tasks by IDs
 * @param {number[]} taskIds - Array of task IDs
 * @param {number} eventId - Event ID (for security)
 * @returns {Promise<number>} Number of deleted tasks
 */
// async function removeMultipleTasks(taskIds, eventId) {
//   if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
//     throw new Error('taskIds must be a non-empty array')
//   }

//   if (!eventId) {
//     throw new Error('eventId is required')
//   }

//   try {
//     // Build IN clause with proper parameterization
//     const placeholders = taskIds.map((_, index) => `$${index + 2}`).join(',')

//     const query = `
//       DELETE FROM "EventTask"
//       WHERE id = ANY($1) AND event_id = $2
//       RETURNING id
//     `

//     const result = await db.query(query, [taskIds, eventId])

//     return result.rows.length
//   } catch (error) {
//     throw error
//   }
// }

/**
 * Delete all tasks for an event (use with caution)
 * @param {number} eventId - Event ID
 * @returns {Promise<number>} Number of deleted tasks
 */
// async function removeAllEventTasks(eventId) {
//   if (!eventId) {
//     throw new Error('eventId is required')
//   }

//   try {
//     const query = `
//       DELETE FROM "EventTask"
//       WHERE event_id = $1
//       RETURNING id
//     `

//     const result = await db.query(query, [eventId])

//     return result.rows.length
//   } catch (error) {
//     throw error
//   }
// }
