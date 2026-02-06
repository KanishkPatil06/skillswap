-- Migration: Allow users to accept help requests from others
-- This allows any authenticated user to update a help request status to 'in_progress'
-- Only the request owner can mark as 'completed' or 'closed'

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can update their own requests" ON public.help_requests;

-- Create new policy: Request owner can update any field
CREATE POLICY "Request owners can update their requests" 
  ON public.help_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create new policy: Any authenticated user can accept (set to in_progress)
CREATE POLICY "Users can accept help requests" 
  ON public.help_requests 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (
    -- Allow updating to in_progress only
    status = 'in_progress' 
    AND 
    -- Only if current status is 'open'
    (SELECT status FROM public.help_requests WHERE id = help_requests.id) = 'open'
  );
