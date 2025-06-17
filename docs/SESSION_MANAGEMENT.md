
# Session Management Documentation

## Overview

The session management system handles teacher-student interactions, session lifecycle, and participant management in the collaborative whiteboard application.

## Core Components

### Session Creation and Management

**TeacherDashboard**
- Session creation with customizable templates
- Class template management
- Session status monitoring

**CreateSessionForm**
- Session title and description
- Template selection
- Participant capacity settings

### Student Participant Management

**Individual Student Management**
- Add students with name and email
- Remove specific students
- Real-time participant tracking
- Board assignment (A-H suffixes)

**Session Participants Flow**
```
1. Teacher creates session
2. Students added individually via Session Options
3. Each student assigned unique board suffix (A, B, C, etc.)
4. Students join via unique session URL
5. Real-time status updates (pending → active)
```

### Session Options Interface

**Location**: TeacherHeader → Session Options Dropdown

**Features**:
- **Session Information**: Display session title and ID
- **URL Management**: Copy and share session URL
- **Student Management**: Add/remove individual students
- **Session Controls**: End session, sign out

### Student Status Tracking

**States**:
- **Pending**: Student added but hasn't joined yet (`joined_at: null`)
- **Active**: Student has joined the session (`joined_at: timestamp`)

**Real-time Updates**:
- Supabase subscription monitors `session_participants` table
- UI updates automatically when students join/leave
- Layout recalculation based on active student count

## Hook Architecture

### useSessionStudents

**Purpose**: Manages session participants and their states

**Key Functions**:
```typescript
- handleAddIndividualStudent(name, email): Add student with details
- handleRemoveIndividualStudent(participantId): Remove specific student
- getStudentsWithStatus(): Get students with join status
```

**Returns**:
```typescript
{
  sessionStudents: SessionParticipant[];
  studentsWithStatus: StudentWithStatus[];
  activeStudentCount: number;
  totalStudentCount: number;
  handleAddIndividualStudent: Function;
  handleRemoveIndividualStudent: Function;
  isLoading: boolean;
}
```

### Student Board Generation

**generateStudentBoardsFromParticipants**
- Converts SessionParticipant[] to StudentBoardInfo[]
- Includes student name, email, and join status
- Maps board suffixes to board IDs

**generateGridSlotsWithStatus**
- Creates paginated grid layout
- Includes null placeholders for empty slots
- Maintains participant information in grid

## Database Schema

### session_participants Table

```sql
- id: Primary key
- session_id: References sessions table
- student_name: Student display name
- student_email: Optional email address
- assigned_board_suffix: Board identifier (A-H)
- joined_at: Timestamp when student joined (null = pending)
```

## UI Components

### Add Student Dialog
- Name input (required)
- Email input (optional)
- Validation and error handling
- Maximum 8 students per session

### Remove Student Dialog
- List of current participants
- Confirmation before removal
- Shows student name and status

### Session URL Display
- Formatted session URL
- Copy to clipboard functionality
- Open in new window option

## Security and Validation

### Student Addition Constraints
- Maximum 8 students per session
- Unique board suffix assignment
- Session existence validation

### URL Security
- Unique session slugs prevent guessing
- Session status validation
- Teacher ownership verification

## Real-time Features

### Participant Subscription
```typescript
supabase
  .channel(`session-participants-${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'session_participants',
    filter: `session_id=eq.${sessionId}`
  })
```

### Status Updates
- Automatic UI refresh on participant changes
- Layout recalculation when students join/leave
- Toast notifications for management actions

## Error Handling

### Common Error Scenarios
- Session not found
- Maximum participants reached
- Database connection issues
- Invalid participant data

### User Feedback
- Toast notifications for all actions
- Loading states during operations
- Clear error messages with guidance

## Best Practices

### Performance
- Efficient real-time subscriptions
- Minimal re-renders on state changes
- Proper cleanup of subscriptions

### User Experience
- Immediate feedback for all actions
- Clear visual status indicators
- Intuitive management interface

### Data Integrity
- Proper foreign key relationships
- Cascade deletion handling
- Atomic operations for data consistency
