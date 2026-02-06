-- Session Booking System Database Schema
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Session details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  skill_to_teach VARCHAR(100), -- What skill will be taught in this session
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  
  -- Meeting details
  meeting_link VARCHAR(500), -- Optional video call link
  meeting_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_connection_id ON sessions(connection_id);
CREATE INDEX IF NOT EXISTS idx_sessions_initiator_id ON sessions(initiator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_participant_id ON sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Session reminders table (for tracking sent reminders)
CREATE TABLE IF NOT EXISTS session_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- '24h_before', '1h_before', '15m_before'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_reminders_session_id ON session_reminders(session_id);

-- Function to create a session
CREATE OR REPLACE FUNCTION create_session(
  p_connection_id UUID,
  p_initiator_id UUID,
  p_participant_id UUID,
  p_title VARCHAR,
  p_description TEXT,
  p_skill_to_teach VARCHAR,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS UUID AS $$
DECLARE
  new_session_id UUID;
BEGIN
  INSERT INTO sessions (
    connection_id, initiator_id, participant_id,
    title, description, skill_to_teach,
    scheduled_at, duration_minutes
  )
  VALUES (
    p_connection_id, p_initiator_id, p_participant_id,
    p_title, p_description, p_skill_to_teach,
    p_scheduled_at, p_duration_minutes
  )
  RETURNING id INTO new_session_id;
  
  -- Create notifications for both users
  PERFORM create_notification(
    p_participant_id,
    'session_request',
    'New Session Request',
    p_title || ' - ' || to_char(p_scheduled_at, 'Mon DD, YYYY at HH12:MI AM'),
    '/sessions/' || new_session_id::text,
    jsonb_build_object('session_id', new_session_id)
  );
  
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm session
CREATE OR REPLACE FUNCTION confirm_session(session_id_param UUID)
RETURNS void AS $$
DECLARE
  session_record RECORD;
BEGIN
  UPDATE sessions
  SET status = 'confirmed',
      confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = session_id_param
  RETURNING * INTO session_record;
  
  -- Notify initiator
  PERFORM create_notification(
    session_record.initiator_id,
    'session_confirmed',
    'Session Confirmed!',
    session_record.title || ' has been confirmed',
    '/sessions/' || session_id_param::text,
    jsonb_build_object('session_id', session_id_param)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to complete session
CREATE OR REPLACE FUNCTION complete_session(session_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE sessions
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = session_id_param;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = participant_id);

CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = participant_id);

-- RLS Policies for session_reminders
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON session_reminders FOR SELECT
  USING (auth.uid() = user_id);
