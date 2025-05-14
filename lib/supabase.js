
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co'; // Remplace par ton URL
const supabaseAnonKey = 'your-anon-key'; // Remplace par ta clé publique

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
