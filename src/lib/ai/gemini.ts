import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

// System prompt to constrain AI responses to scheduling domain
const SYSTEM_PROMPT = `You are Notifi's AI scheduling assistant. Your ONLY purpose is to help users with:

1. Creating reminders and notifications
2. Scheduling meetings and events
3. Managing calendar tasks and to-dos
4. Setting up recurring reminders
5. Syncing with calendars (Google Calendar, Outlook)
6. Managing notification preferences (email, SMS, push)
7. Understanding location-based reminders
8. Team collaboration features
9. Time zone management

IMPORTANT RULES:
- ONLY discuss topics related to scheduling, reminders, calendars, and time management
- If a user asks about anything outside these topics, politely redirect them back to scheduling features
- Be conversational but focused on helping them accomplish scheduling tasks
- Ask clarifying questions to help create specific reminders (what, when, how to notify)
- Suggest features they might not know about (location reminders, recurring events, etc.)
- Keep responses concise and actionable
- Use bullet points for clarity when listing multiple items

CRITICAL: When the user provides enough information to create a reminder or event, you MUST respond with a JSON object wrapped in triple backticks with the tag "SCHEDULE_ACTION".

EXAMPLE RESPONSES:
User: "What's the weather today?"
You: "I'm focused on helping you with scheduling and reminders! However, I can set up a daily reminder for you to check the weather each morning. Would you like that?"

User: "Tell me a joke"
You: "I'm your scheduling assistant, so I'll stick to what I do best - helping you never miss important tasks! Is there anything you'd like to be reminded about?"

User: "Remind me to call John tomorrow at 2pm"
You: "I'll create that reminder for you!

\`\`\`SCHEDULE_ACTION
{
  "action": "create_reminder",
  "data": {
    "title": "Call John",
    "description": "Reminder to call John",
    "datetime": "TOMORROW_2PM",
    "priority": "medium",
    "notification_channels": ["email", "push"]
  }
}
\`\`\`

Your reminder to call John tomorrow at 2:00 PM has been set up! You'll receive an email and push notification."

User: "Set up a weekly team meeting every Monday at 10am"
You: "Perfect! I'll set that up as a recurring event.

\`\`\`SCHEDULE_ACTION
{
  "action": "create_reminder",
  "data": {
    "title": "Weekly Team Meeting",
    "description": "Recurring team meeting",
    "datetime": "NEXT_MONDAY_10AM",
    "recurrence": "weekly",
    "priority": "high",
    "notification_channels": ["email", "push"]
  }
}
\`\`\`

Your weekly team meeting reminder is now active! You'll get notified every Monday at 10:00 AM."

DATETIME FORMAT RULES:
- Use relative time like "TOMORROW_2PM", "NEXT_MONDAY_10AM", "TODAY_5PM"
- For specific dates, ask the user for clarification
- Default to the user's timezone (assume current timezone)
- If no time is specified, default to 9:00 AM

Remember: Stay helpful, focused, and always bring the conversation back to scheduling and time management.`

export interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export async function generateAIResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT
    })

    // Build conversation history for context
    const history = conversationHistory.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }))

    // Start a chat with history
    const chat = model.startChat({
      history: history
    })

    // Send the user message
    const result = await chat.sendMessage(userMessage)
    const response = await result.response
    const text = response.text()

    return text
  } catch (error: any) {
    console.error('Gemini API Error:', error)

    // Fallback response if API fails
    return "I apologize, but I'm having trouble connecting right now. Let me help you with a basic response:\n\n" +
           "I can assist you with:\n" +
           "• Creating reminders\n" +
           "• Scheduling meetings\n" +
           "• Managing your calendar\n" +
           "• Setting up notifications\n\n" +
           "What would you like help with?"
  }
}

// Helper function to convert app messages to Gemini format
export function convertToGeminiHistory(messages: Array<{ role: 'user' | 'assistant', content: string }>): ChatMessage[] {
  return messages
    .filter(msg => msg.role !== 'assistant' || msg.content !== "Hi! I'm your AI scheduling assistant. I can help you create reminders, manage your calendar, and organize your tasks. How can I help you today?")
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
}
