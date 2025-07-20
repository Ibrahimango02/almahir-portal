# Database Triggers for Free Absences Management

This document explains the database triggers implemented to automatically manage student free absences.

## Overview

The system automatically decrements a student's `free_absences_remaining` count in the `student_subscriptions` table whenever they are marked as "absent" in the `student_attendance` table.

## Trigger Function: `update_free_absences_on_attendance()`

### Purpose
Automatically decrements the `free_absences_remaining` field when a student is marked as absent.

### How it works
1. **Triggers on**: INSERT or UPDATE operations on the `student_attendance` table
2. **Conditions**: Only executes when `attendance_status` is set to 'absent'
3. **Logic**: 
   - For INSERT: Always decrements if status is 'absent'
   - For UPDATE: Only decrements if status changed from something else to 'absent'
   - Only decrements if `free_absences_remaining > 0`
   - Uses `GREATEST(0, free_absences_remaining - 1)` to ensure it never goes below 0

### Database Tables Involved
- **student_attendance**: Source table (triggers on changes here)
- **student_subscriptions**: Target table (updates free_absences_remaining here)
- **subscriptions**: Reference table (contains max_free_absences)

## Installation

Run the SQL commands in `database-triggers.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-triggers.sql`
4. Execute the script

## Usage Examples

### Marking a student as absent (triggers automatically)
```sql
-- This will automatically decrement free_absences_remaining
INSERT INTO student_attendance (student_id, session_id, attendance_status)
VALUES ('student-uuid', 'session-uuid', 'absent');

-- Or updating existing attendance to absent
UPDATE student_attendance 
SET attendance_status = 'absent'
WHERE student_id = 'student-uuid' AND session_id = 'session-uuid';
```

### Check current free absences remaining
```sql
SELECT get_free_absences_remaining('student-uuid');
```

### Reset free absences for a new subscription period
```sql
SELECT reset_free_absences_for_student('student-uuid');
```

## Important Notes

### Safety Features
- **No negative values**: The trigger uses `GREATEST(0, free_absences_remaining - 1)` to prevent negative values
- **Active subscriptions only**: Only updates active subscriptions (`status = 'active'`)
- **Prevents double-counting**: Only decrements when status actually changes to 'absent'

### Performance Considerations
- The trigger is lightweight and only executes when necessary
- Uses efficient WHERE clauses to minimize impact
- Updates only the specific student's subscription record

### Business Logic
- Free absences are decremented immediately when marked absent
- The count cannot go below 0
- Only affects active subscriptions
- Works with both new attendance records and status updates

## Monitoring and Debugging

### Check if trigger is working
```sql
-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_free_absences';

-- Test the trigger function
SELECT update_free_absences_on_attendance();
```

### View trigger execution logs
```sql
-- Check recent attendance changes
SELECT 
    sa.student_id,
    sa.attendance_status,
    sa.created_at,
    ss.free_absences_remaining
FROM student_attendance sa
LEFT JOIN student_subscriptions ss ON sa.student_id = ss.student_id
WHERE sa.attendance_status = 'absent'
ORDER BY sa.created_at DESC
LIMIT 10;
```

## Integration with Application Code

The trigger works automatically with your existing application code. No changes are needed to your TypeScript functions like:

- `updateSessionAttendance()` in `put-classes.ts`
- `updateStudentAttendance()` in `put-students.ts`
- Any other attendance update functions

The trigger will automatically fire whenever these functions update attendance records.

## Troubleshooting

### Common Issues

1. **Trigger not firing**: Ensure the trigger was created successfully
2. **No decrement happening**: Check if the student has an active subscription
3. **Wrong count**: Verify the student_subscriptions table has the correct initial values

### Reset if needed
```sql
-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_free_absences ON student_attendance;
-- Then run the CREATE TRIGGER command again
``` 