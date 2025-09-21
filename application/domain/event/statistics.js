/**
 * Get comprehensive event statistics
 * @returns {Promise<Object>} Event statistics including counts by status, totals, and trends
 */
async () => {
  try {
    console.log('Fetching event statistics...');

    const sql = `
      WITH event_stats AS (
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_events,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_events,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_events,
          COALESCE(SUM(expected_guests), 0) as total_guests,
          COALESCE(SUM(max_fleet), 0) as total_fleet_capacity,
          COALESCE(SUM(max_vapp), 0) as total_vapp_capacity,
          COALESCE(AVG(expected_guests), 0) as avg_guests_per_event,
          COALESCE(AVG(max_fleet), 0) as avg_fleet_per_event,
          COALESCE(AVG(max_vapp), 0) as avg_vapp_per_event
        FROM "Event"
      ),
    recent_events AS (
      SELECT 
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as events_this_month,
        COUNT(CASE WHEN start_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as events_next_week,
        COUNT(CASE WHEN start_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as events_next_month
      FROM "Event"
    ),
    status_breakdown AS (
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(expected_guests), 0) as total_guests,
        COALESCE(SUM(max_fleet), 0) as total_fleet,
        COALESCE(SUM(max_vapp), 0) as total_vapp
      FROM "Event"
      GROUP BY status
      ORDER BY 
        CASE status 
          WHEN 'planning' THEN 1
          WHEN 'active' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
        END
    ),
    geographic_stats AS (
      SELECT 
        country_code,
        COUNT(*) as event_count,
        COALESCE(SUM(expected_guests), 0) as total_guests
      FROM "Event"
      WHERE country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY event_count DESC
      LIMIT 10
    ),
    upcoming_events AS (
      SELECT 
        id,
        name,
        start_at,
        expected_guests,
        status,
        organizer_name
      FROM "Event"
      WHERE start_at >= CURRENT_DATE
      ORDER BY start_at ASC
      LIMIT 5
    )
    SELECT 
      es.*,
      re.events_this_month,
      re.events_next_week,
      re.events_next_month,
      COALESCE(
        json_agg(
          json_build_object(
            'status', sb.status,
            'count', sb.count,
            'total_guests', sb.total_guests,
            'total_fleet', sb.total_fleet,
            'total_vapp', sb.total_vapp
          )
        ) FILTER (WHERE sb.status IS NOT NULL),
        '[]'::json
      ) as status_breakdown,
      COALESCE(
        json_agg(
          json_build_object(
            'country', gs.country_code,
            'event_count', gs.event_count,
            'total_guests', gs.total_guests
          )
        ) FILTER (WHERE gs.country_code IS NOT NULL),
        '[]'::json
      ) as geographic_stats,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ue.id,
            'name', ue.name,
            'start_at', ue.start_at,
            'expected_guests', ue.expected_guests,
            'status', ue.status,
            'organizer_name', ue.organizer_name
          )
        ) FILTER (WHERE ue.id IS NOT NULL),
        '[]'::json
      ) as upcoming_events
    FROM event_stats es
    CROSS JOIN recent_events re
    LEFT JOIN status_breakdown sb ON true
    LEFT JOIN geographic_stats gs ON true
    LEFT JOIN upcoming_events ue ON true
    GROUP BY 
      es.total_events, es.planning_events, es.active_events, es.completed_events, es.cancelled_events,
      es.total_guests, es.total_fleet_capacity, es.total_vapp_capacity,
      es.avg_guests_per_event, es.avg_fleet_per_event, es.avg_vapp_per_event,
      re.events_this_month, re.events_next_week, re.events_next_month
  `;

    const { rows } = await db.pg.query(sql);
    const stats = rows[0];

    console.log('Statistics query result:', stats);

    // Calculate utilization percentages
    const fleetUtilization =
      stats.total_fleet_capacity > 0
        ? Math.round((stats.total_guests / stats.total_fleet_capacity) * 100)
        : 0;

    const vappUtilization =
      stats.total_vapp_capacity > 0
        ? Math.round((stats.total_guests / stats.total_vapp_capacity) * 100)
        : 0;

    const result = {
      overview: {
        total_events: parseInt(stats.total_events) || 0,
        planning_events: parseInt(stats.planning_events) || 0,
        active_events: parseInt(stats.active_events) || 0,
        completed_events: parseInt(stats.completed_events) || 0,
        cancelled_events: parseInt(stats.cancelled_events) || 0,
        total_guests: parseInt(stats.total_guests) || 0,
        total_fleet_capacity: parseInt(stats.total_fleet_capacity) || 0,
        total_vapp_capacity: parseInt(stats.total_vapp_capacity) || 0,
        avg_guests_per_event: Math.round(
          parseFloat(stats.avg_guests_per_event) || 0,
        ),
        avg_fleet_per_event: Math.round(
          parseFloat(stats.avg_fleet_per_event) || 0,
        ),
        avg_vapp_per_event: Math.round(
          parseFloat(stats.avg_vapp_per_event) || 0,
        ),
        fleet_utilization: Math.min(fleetUtilization, 100),
        vapp_utilization: Math.min(vappUtilization, 100),
      },
      timeline: {
        events_this_month: parseInt(stats.events_this_month) || 0,
        events_next_week: parseInt(stats.events_next_week) || 0,
        events_next_month: parseInt(stats.events_next_month) || 0,
        upcoming_events: stats.upcoming_events || [],
      },
      status_breakdown: stats.status_breakdown || [],
      geographic: stats.geographic_stats || [],
    };

    console.log('Final statistics result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    throw error;
  }
};
