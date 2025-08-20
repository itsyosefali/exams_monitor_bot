import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import moment from 'moment';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Telegram bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Bot commands
bot.setMyCommands([
  { command: '/start', description: 'ابدأ' },
  { command: '/add', description: 'أضف موعد' },
  { command: '/list', description: 'عرض مواعيدي' },
  { command: '/edit', description: 'عدّل موعد' },
  { command: '/delete', description: 'احذف موعد' },
  { command: '/help', description: 'مساعدة' }
]);

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🎓 *مرحباً! أنا بوت المواعيد*

سأذكرك بالامتحانات والواجبات

*الأوامر:*
• /add - أضف موعد جديد
• /list - عرض مواعيدي
• /edit - عدّل موعد
• /delete - احذف موعد
• /help - مساعدة

*مثال:*
/add
امتحان رياضيات
18-02-2026

سأذكرك قبل الموعد! 📚
  `;
  
  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Add event command
bot.onText(/\/add/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const chatType = msg.chat.type; // 'private', 'group', 'supergroup'
  
  // Store user state for multi-step input
  userStates.set(userId, { 
    action: 'adding_event',
    step: 'waiting_for_subject',
    data: { chatId, chatType }
  });
  
  await bot.sendMessage(chatId, 
    "📝 *موعد جديد*\n\n" +
    "ما هو الموعد؟ (مثل: امتحان رياضيات):", 
    { parse_mode: 'Markdown' }
  );
});

// List events command
bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    // Get current date at start of day in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const { data: events, error } = await supabase
      .from('academic_events')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .gte('event_date', today.toISOString())
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    
    if (!events || events.length === 0) {
      await bot.sendMessage(chatId, "📅 لا توجد مواعيد!");
      return;
    }
    
    let message = "📅 *مواعيدي:*\n\n";
    events.forEach((event, index) => {
      const date = moment(event.event_date).format('DD-MM-YYYY');
      const daysLeft = moment(event.event_date).diff(moment(), 'days');
      const urgency = daysLeft <= 3 ? '🚨' : daysLeft <= 7 ? '⚠️' : '📚';
      
      message += `${urgency} *${event.subject}*\n`;
      message += `📅 ${date} (${daysLeft} يوم)\n\n`;
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    await bot.sendMessage(chatId, "❌ خطأ! حاول مرة أخرى.");
  }
});

// Edit command
bot.onText(/\/edit/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const { data: events, error } = await supabase
      .from('academic_events')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    
    if (!events || events.length === 0) {
      await bot.sendMessage(chatId, "📅 لا توجد مواعيد للتعديل!");
      return;
    }
    
    let message = "📝 *اختر موعد للتعديل:*\n\n";
    events.forEach((event, index) => {
      const date = moment(event.event_date).format('DD-MM-YYYY');
      message += `${index + 1}. ${event.subject} (${date})\n`;
    });
    
    message += "\nاكتب الرقم (1، 2، 3...):";
    
    userStates.set(userId, { 
      action: 'editing_event',
      step: 'choosing_event',
      data: { events, chatId }
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    await bot.sendMessage(chatId, "❌ خطأ! حاول مرة أخرى.");
  }
});

// Delete command
bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const { data: events, error } = await supabase
      .from('academic_events')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    
    if (!events || events.length === 0) {
      await bot.sendMessage(chatId, "📅 لا توجد مواعيد للحذف!");
      return;
    }
    
    let message = "🗑️ *اختر موعد للحذف:*\n\n";
    events.forEach((event, index) => {
      const date = moment(event.event_date).format('DD-MM-YYYY');
      message += `${index + 1}. ${event.subject} (${date})\n`;
    });
    
    message += "\nاكتب الرقم (1، 2، 3...):";
    
    userStates.set(userId, { 
      action: 'deleting_event',
      step: 'choosing_event',
      data: { events, chatId }
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    await bot.sendMessage(chatId, "❌ Error! Try again.");
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🔧 *مساعدة*

*الأوامر:*
• /add - أضف موعد جديد
• /list - عرض مواعيدي
• /edit - عدّل موعد
• /delete - احذف موعد
• /help - هذه المساعدة

*كيفية الإضافة:*
1. /add
2. ما هو الموعد؟
3. متى؟ (DD-MM-YYYY)
4. اكتب 'نعم'

*أمثلة:*
• امتحان رياضيات
• تقرير فيزياء
• واجب كيمياء

سأذكرك قبل الموعد! ⏰
  `;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Handle text messages for multi-step input
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return; // Skip commands
  
  const userId = msg.from.id;
  const userState = userStates.get(userId);
  
  if (!userState) return;
  
  const chatId = msg.chat.id;
  
  try {
    switch (userState.action) {
      case 'adding_event':
        await handleAddingEvent(msg, chatId, userId, userState);
        break;
      case 'editing_event':
        await handleEditingEvent(msg, chatId, userId, userState);
        break;
      case 'deleting_event':
        await handleDeletingEvent(msg, chatId, userId, userState);
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(chatId, "❌ Error! Try again.");
    userStates.delete(userId);
  }
});

// Handle adding event step by step
async function handleAddingEvent(msg, chatId, userId, userState) {
  const text = msg.text;
  
  switch (userState.step) {
    case 'waiting_for_subject':
      userState.data.subject = text;
      userState.step = 'waiting_for_date';
      
              await bot.sendMessage(chatId, 
          "📅 متى؟ (DD-MM-YYYY, مثل: 18-02-2026):"
        );
      break;
      
    case 'waiting_for_date':
      const date = parseDate(text);
              if (!date) {
          await bot.sendMessage(chatId, 
            "❌ التاريخ غير صحيح! استخدم DD-MM-YYYY (مثل: 18-02-2026):"
          );
          return;
        }
      
      userState.data.event_date = date;
      userState.step = 'confirming';
      
              const confirmMessage = `
✅ *تفاصيل الموعد:*

📚 ${userState.data.subject}
📅 ${moment(date).format('DD-MM-YYYY')}

صحيح؟ اكتب 'نعم' أو 'لا':
        `;
      
      await bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
      break;
      
          case 'confirming':
        if (text.toLowerCase() === 'yes' || text.toLowerCase() === 'نعم' || text === 'نعم') {
        try {
          const { error } = await supabase
            .from('academic_events')
            .insert({
              user_id: userId,
              chat_id: userState.data.chatId,
              chat_type: userState.data.chatType,
              subject: userState.data.subject,
              event_date: userState.data.event_date,
              created_at: new Date().toISOString()
            });
          
          if (error) throw error;
          
          await bot.sendMessage(chatId, 
            "✅ *تم الإضافة!*\n\n" +
            `📚 ${userState.data.subject}\n` +
            `📅 ${moment(userState.data.event_date).format('DD-MM-YYYY')}\n\n` +
            "سأذكرك! ⏰", 
            { parse_mode: 'Markdown' }
          );
          
        } catch (error) {
          console.error('Error adding event:', error);
          await bot.sendMessage(chatId, "❌ خطأ في الإضافة. حاول مرة أخرى.");
        }
              } else {
          await bot.sendMessage(chatId, "❌ تم الإلغاء. استخدم /add للمحاولة مرة أخرى.");
        }
      
      userStates.delete(userId);
      break;
  }
}

// Handle editing event
async function handleEditingEvent(msg, chatId, userId, userState) {
  const text = msg.text;
  
  switch (userState.step) {
    case 'choosing_event':
      const eventIndex = parseInt(text) - 1;
      if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= userState.data.events.length) {
        await bot.sendMessage(chatId, "❌ رقم غير صحيح! حاول مرة أخرى:");
        return;
      }
      
      const event = userState.data.events[eventIndex];
      userState.data.selectedEvent = event;
      userState.step = 'editing_subject';
      
              await bot.sendMessage(chatId, 
          `📝 *تعديل:* ${event.subject}\n\n` +
          "الاسم الجديد؟ (أو اكتب 'تخطى' للاحتفاظ بالحالي):", 
          { parse_mode: 'Markdown' }
        );
      break;
      
    case 'editing_subject':
              if (text.toLowerCase() !== 'skip' && text.toLowerCase() !== 'تخطى') {
          userState.data.newSubject = text;
        }
      userState.step = 'editing_date';
      
      const currentDate = moment(userState.data.selectedEvent.event_date).format('DD-MM-YYYY');
      await bot.sendMessage(chatId, 
        `📅 التاريخ الحالي: ${currentDate}\n\n` +
        "التاريخ الجديد؟ (DD-MM-YYYY) أو اكتب 'تخطى':", 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case 'editing_date':
      let newDate = userState.data.selectedEvent.event_date;
      if (text.toLowerCase() !== 'skip' && text.toLowerCase() !== 'تخطى') {
        const parsedDate = parseDate(text);
        if (!parsedDate) {
          await bot.sendMessage(chatId, "❌ التاريخ غير صحيح! حاول مرة أخرى:");
          return;
        }
        newDate = parsedDate;
      }
      
      const newSubject = userState.data.newSubject || userState.data.selectedEvent.subject;
      
      try {
        const { error } = await supabase
          .from('academic_events')
          .update({
            subject: newSubject,
            event_date: newDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', userState.data.selectedEvent.id);
        
        if (error) throw error;
        
        await bot.sendMessage(chatId, 
          "✅ *تم التحديث!*\n\n" +
          `📚 ${newSubject}\n` +
          `📅 ${moment(newDate).format('DD-MM-YYYY')}`, 
          { parse_mode: 'Markdown' }
        );
        
      } catch (error) {
        console.error('Error updating event:', error);
        await bot.sendMessage(chatId, "❌ خطأ في التحديث! حاول مرة أخرى.");
      }
      
      userStates.delete(userId);
      break;
  }
}

// Handle deleting event
async function handleDeletingEvent(msg, chatId, userId, userState) {
  const text = msg.text;
  
  if (userState.step === 'choosing_event') {
    const eventIndex = parseInt(text) - 1;
    if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= userState.data.events.length) {
              await bot.sendMessage(chatId, "❌ رقم غير صحيح! حاول مرة أخرى:");
      return;
    }
    
    const event = userState.data.events[eventIndex];
    
    try {
      const { error } = await supabase
        .from('academic_events')
        .delete()
        .eq('id', event.id);
      
      if (error) throw error;
      
              await bot.sendMessage(chatId, 
          "🗑️ *تم الحذف:* " + event.subject, 
          { parse_mode: 'Markdown' }
        );
      
    } catch (error) {
      console.error('Error deleting event:', error);
              await bot.sendMessage(chatId, "❌ خطأ في الحذف! حاول مرة أخرى.");
    }
    
    userStates.delete(userId);
  }
}

// Parse date from DD-MM-YYYY format
function parseDate(dateString) {
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
  const year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  // Create date in local timezone (end of day to include the full day)
  const date = new Date(year, month, day, 23, 59, 59);
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
}

// User states storage
const userStates = new Map();

// Schedule notifications
cron.schedule('0 9 * * *', async () => {
  await checkAndSendNotifications();
});

// Check and send notifications
async function checkAndSendNotifications() {
  try {
    const now = new Date();
    const notificationTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    const { data: events, error } = await supabase
      .from('academic_events')
      .select('*')
      .gte('event_date', now.toISOString())
      .lte('event_date', notificationTime.toISOString());
    
    if (error) throw error;
    
    for (const event of events) {
      const daysLeft = moment(event.event_date).diff(moment(), 'days');
      const hoursLeft = moment(event.event_date).diff(moment(), 'hours');
      
      if (daysLeft === 1 || (daysLeft === 0 && hoursLeft <= 2)) {
        const urgency = hoursLeft <= 2 ? '🚨 URGENT: ' : '⚠️ REMINDER: ';
        const message = `${urgency}${event.subject} is due ${daysLeft === 0 ? 'in a few hours' : 'tomorrow'}!`;
        
        // Send notification to the user in the specific chat
        try {
          await bot.sendMessage(event.chat_id, message);
        } catch (error) {
          // If chat not accessible, try sending to user directly
          await bot.sendMessage(event.user_id, message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

console.log('🤖 Academic Deadline Bot is running...');
console.log('Use /start to begin!');
