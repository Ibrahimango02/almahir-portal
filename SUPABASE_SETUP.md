# Supabase Setup Guide

## Automatic Profile Creation Trigger

This application uses a Supabase trigger to automatically create a profile when a new user is added to the `auth.users` table.

### How to Set Up the Trigger

1. **Go to your Supabase Dashboard**
   - Navigate to your project dashboard
   - Go to the **SQL Editor** section

2. **Run the Trigger SQL**
   - Copy the contents of `supabase-trigger.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the SQL

3. **Verify the Trigger**
   - Go to **Database** → **Functions** in your Supabase dashboard
   - You should see `handle_new_user` function
   - Go to **Database** → **Triggers** 
   - You should see `on_auth_user_created` trigger

### What the Trigger Does

The trigger automatically:
- Creates a profile record when a new user signs up
- Extracts user metadata (first_name, last_name, role) from auth user
- Sets default values for required fields
- Maintains referential integrity between auth.users and profiles

### Trigger Function Details

```sql
-- Function extracts data from auth.users and inserts into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,                    -- Uses auth user ID
    email,                 -- From auth user email
    first_name,           -- From user_metadata
    last_name,            -- From user_metadata  
    role,                 -- From user_metadata (defaults to 'user')
    status,               -- Defaults to 'active'
    created_at,           -- Current timestamp
    updated_at            -- Current timestamp
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Benefits

- ✅ **Automatic**: No manual profile creation needed
- ✅ **Consistent**: All users get profiles with proper defaults
- ✅ **Secure**: Uses SECURITY DEFINER for proper permissions
- ✅ **Reliable**: Handles the foreign key constraint automatically

### Testing the Trigger

After setting up the trigger, you can test it by:
1. Creating a new user through the invitation system
2. Checking that a profile was automatically created
3. Verifying the profile has the correct data from the invitation

The invitation system now only needs to create the auth user, and the trigger handles the rest! 