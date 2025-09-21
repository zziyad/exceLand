/**
 * Update an existing task
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @param {Object} updateData - Fields to update
 * @param {string} [updateData.name] - Task name
 * @param {string} [updateData.description] - Task description
 * @param {string} [updateData.deadline] - Task deadline (ISO string)
 * @param {string} [updateData.priority] - Task priority (urgent, high, medium, low)
 * @param {string} [updateData.status] - Task status (active, completed)
 * @returns {Promise<Object>} Updated task
 */
async (taskId, eventId, updateData) => {
  if (!taskId || !eventId) {
    throw new Error('taskId and eventId are required');
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error('No update data provided');
  }

  const { name, description, deadline, priority, status } = updateData;

  // Validate priority values if provided
  if (priority) {
    const validPriorities = ['urgent', 'high', 'medium', 'low'];
    if (!validPriorities.includes(priority)) {
      throw new Error(
        'Invalid priority value. Must be one of: urgent, high, medium, low',
      );
    }
  }

  // Validate status values if provided
  if (status) {
    const validStatuses = ['active', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(
        'Invalid status value. Must be one of: active, completed',
      );
    }
  }

  // Validate deadline if provided
  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      throw new Error('Deadline must be in the future');
    }
  }

  try {
    // Build dynamic UPDATE query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (deadline !== undefined) {
      paramCount++;
      updateFields.push(`deadline = $${paramCount}`);
      values.push(deadline);
    }

    if (priority !== undefined) {
      paramCount++;
      updateFields.push(`priority = $${paramCount}`);
      values.push(priority);
    }

    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
    }

    // Add updated_at timestamp
    paramCount++;
    updateFields.push(`updated_at = now()`);

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add taskId and eventId to values array
    values.push(taskId, eventId);

    const query = `
      UPDATE "EventTask"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1} AND event_id = $${paramCount + 2}
      RETURNING *
    `;

    const result = await db.pg.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Update task status (shortcut for status changes)
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @param {string} status - New status (active, completed)
 * @returns {Promise<Object>} Updated task
 */
// async function updateTaskStatus(taskId, eventId, status) {
//   return updateTask(taskId, eventId, { status })
// }

/**
 * Mark task as completed
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @returns {Promise<Object>} Updated task
 */
// async function completeTask(taskId, eventId) {
//   return updateTask(taskId, eventId, { status: 'completed' })
// }

/**
 * Reactivate a completed task
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @returns {Promise<Object>} Updated task
 */
// async function reactivateTask(taskId, eventId) {
//   return updateTask(taskId, eventId, { status: 'active' })
// }
