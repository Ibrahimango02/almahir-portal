-- Function to handle role-based table insertion
CREATE OR REPLACE FUNCTION public.handle_role_based_insertion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check the role and insert into appropriate table
  CASE NEW.role
    WHEN 'teacher' THEN
      -- Insert into teachers table
      INSERT INTO public.teachers (
        profile_id,
        specialization,
        hourly_rate,
        notes,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NULL, -- specialization (can be updated later)
        NULL, -- hourly_rate (can be updated later)
        NULL, -- notes (can be updated later)
        NOW(),
        NOW()
      );
      
    WHEN 'student' THEN
      -- Insert into students table
      INSERT INTO public.students (
        profile_id,
        birth_date,
        grade_level,
        notes,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NULL, -- birth_date (can be updated later)
        NULL, -- grade_level (can be updated later)
        NULL, -- notes (can be updated later)
        NOW(),
        NOW()
      );
      
    WHEN 'parent' THEN
      -- Insert into parents table (if it exists as a separate table)
      -- Note: Based on the codebase analysis, parents might be stored directly in profiles
      -- If you have a separate parents table, uncomment the following:
      /*
      INSERT INTO public.parents (
        profile_id,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NOW(),
        NOW()
      );
      */
      
      -- For now, we'll just log that a parent was created
      -- You can add specific parent table logic here if needed
      NULL;
      
    ELSE
      -- For other roles (like 'admin'), do nothing
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new profile is inserted
DROP TRIGGER IF EXISTS on_profile_role_insertion ON public.profiles;
CREATE TRIGGER on_profile_role_insertion
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_based_insertion();

-- Optional: Also handle role updates if needed
-- This trigger will handle cases where a user's role is updated
CREATE OR REPLACE FUNCTION public.handle_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the role has actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Remove from old role table if exists
    CASE OLD.role
      WHEN 'teacher' THEN
        DELETE FROM public.teachers WHERE profile_id = NEW.id;
      WHEN 'student' THEN
        DELETE FROM public.students WHERE profile_id = NEW.id;
      WHEN 'parent' THEN
        -- DELETE FROM public.parents WHERE profile_id = NEW.id; -- Uncomment if parents table exists
        NULL;
      ELSE
        NULL;
    END CASE;
    
    -- Insert into new role table
    CASE NEW.role
      WHEN 'teacher' THEN
        INSERT INTO public.teachers (
          profile_id,
          specialization,
          hourly_rate,
          notes,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NULL,
          NULL,
          NULL,
          NOW(),
          NOW()
        );
        
      WHEN 'student' THEN
        INSERT INTO public.students (
          profile_id,
          birth_date,
          grade_level,
          notes,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NULL,
          NULL,
          NULL,
          NOW(),
          NOW()
        );
        
      WHEN 'parent' THEN
        -- INSERT INTO public.parents (profile_id, created_at, updated_at) VALUES (NEW.id, NOW(), NOW());
        NULL;
        
      ELSE
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for role updates
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_update(); 