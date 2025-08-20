import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Create the academic_events table
    const { error } = await supabase.rpc('create_academic_events_table');
    
    if (error) {
      // If RPC doesn't exist, create table manually via SQL
      console.log('📝 Creating table via SQL...');
      
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS academic_events (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            subject TEXT NOT NULL,
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create index for faster queries
          CREATE INDEX IF NOT EXISTS idx_academic_events_user_date 
          ON academic_events(user_id, event_date);
          
          -- Create index for notification queries
          CREATE INDEX IF NOT EXISTS idx_academic_events_date 
          ON academic_events(event_date);
        `
      });
      
      if (sqlError) {
        console.log('⚠️ SQL execution failed, trying direct table creation...');
        
        // Try to create table directly (this might work in some Supabase setups)
        const { error: directError } = await supabase
          .from('academic_events')
          .select('id')
          .limit(1);
        
        if (directError && directError.code === '42P01') {
          console.log('📋 Please create the table manually in your Supabase dashboard:');
          console.log(`
          CREATE TABLE academic_events (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            chat_id BIGINT NOT NULL,
            chat_type TEXT NOT NULL,
            subject TEXT NOT NULL,
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX idx_academic_events_user_date ON academic_events(user_id, event_date);
          CREATE INDEX idx_academic_events_date ON academic_events(event_date);
          CREATE INDEX idx_academic_events_chat ON academic_events(chat_id);
          `);
        } else if (directError) {
          throw directError;
        }
      }
    }
    
    console.log('✅ Database setup completed successfully!');
    console.log('📋 Table structure:');
    console.log('  - academic_events (id, user_id, subject, event_date, created_at, updated_at)');
    console.log('  - Indexes for fast user and date queries');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n📋 Please create the table manually in your Supabase dashboard:');
    console.log(`
    CREATE TABLE academic_events (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      subject TEXT NOT NULL,
      event_date TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_academic_events_user_date ON academic_events(user_id, event_date);
    CREATE INDEX idx_academic_events_date ON academic_events(event_date);
    `);
  }
}

// Run setup
setupDatabase();
