-- Function to handle invitation updates when a user is created
CREATE OR REPLACE FUNCTION public.handle_invitation_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the invitation record for this user's email
  UPDATE public.invitations 
  SET 
    status = 'accepted',
    used_at = NOW(),
    accepted_by = NEW.id
  WHERE 
    email = NEW.email 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_invitation_used ON auth.users;
CREATE TRIGGER on_auth_user_invitation_used
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_usage();

-- Optional: Also handle cases where the invitation might need to be updated
-- if the user creation fails and needs to be retried
CREATE OR REPLACE FUNCTION public.handle_invitation_retry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the invitation is still pending and hasn't been used
  UPDATE public.invitations 
  SET 
    status = 'accepted',
    used_at = NOW(),
    accepted_by = NEW.id
  WHERE 
    email = NEW.email 
    AND status = 'pending'
    AND used_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative trigger that can be used if you want to be more specific about when to update
-- This version only updates if there's a matching pending invitation
DROP TRIGGER IF EXISTS on_auth_user_invitation_used_safe ON auth.users;
CREATE TRIGGER on_auth_user_invitation_used_safe
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (EXISTS (
    SELECT 1 FROM public.invitations 
    WHERE email = NEW.email AND status = 'pending'
  ))
  EXECUTE FUNCTION public.handle_invitation_retry(); 