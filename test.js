import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Academic Deadline Bot Configuration');
console.log('============================================');

// Check environment variables
const requiredVars = ['TELEGRAM_BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    console.log(`✅ ${varName}: ${varName.includes('KEY') ? '***' + process.env[varName].slice(-4) : process.env[varName]}`);
  }
});

if (missingVars.length > 0) {
  console.log(`\n❌ Missing environment variables: ${missingVars.join(', ')}`);
  console.log('Please check your .env file');
  process.exit(1);
}

// Test Supabase connection
console.log('\n🔌 Testing Supabase connection...');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSupabase() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('academic_events')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Table "academic_events" does not exist yet');
        console.log('Run "npm run setup" to create the table');
      } else {
        console.log(`❌ Supabase connection error: ${error.message}`);
      }
    } else {
      console.log('✅ Supabase connection successful');
      console.log('✅ Table "academic_events" exists');
    }
    
  } catch (error) {
    console.log(`❌ Supabase connection failed: ${error.message}`);
  }
}

// Test date parsing
console.log('\n📅 Testing date parsing...');

function testDateParsing() {
  const testDates = [
    '18-02-2026',
    '01-12-2025',
    '31-12-2024',
    'invalid-date',
    '32-13-2025'
  ];
  
  testDates.forEach(dateStr => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      console.log(`❌ "${dateStr}": Invalid format`);
      return;
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.log(`❌ "${dateStr}": Invalid numbers`);
      return;
    }
    
    const date = new Date(year, month, day);
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      console.log(`❌ "${dateStr}": Invalid date`);
      return;
    }
    
    console.log(`✅ "${dateStr}" → ${date.toISOString().split('T')[0]}`);
  });
}

// Run tests
testSupabase();
testDateParsing();

console.log('\n🎯 Configuration test completed!');
console.log('If all tests pass, you can run the bot with: npm start');
