export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    url: string;
    title: string;
    description?: string;
    content?: string;
    markdown?: string;
    publishedDate?: string;
    author?: string;
    image?: string;
    favicon?: string;
    siteName?: string;
  }>;
  followUpQuestions?: string[];
  ticker?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

const STORAGE_KEY = 'fireplexity_conversations';

export class ConversationStorage {
  static getConversations(userId: string): Conversation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const allConversations: Conversation[] = JSON.parse(stored);
      return allConversations
        .filter(conv => conv.userId === userId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  static getConversation(conversationId: string, userId: string): Conversation | null {
    try {
      const conversations = this.getConversations(userId);
      return conversations.find(conv => conv.id === conversationId) || null;
    } catch (error) {
      console.error('Error loading conversation:', error);
      return null;
    }
  }

  static saveConversation(conversation: Conversation): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allConversations: Conversation[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = allConversations.findIndex(conv => conv.id === conversation.id);
      
      if (existingIndex >= 0) {
        allConversations[existingIndex] = conversation;
      } else {
        allConversations.push(conversation);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allConversations));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  static createConversation(userId: string, title: string): Conversation {
    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId,
    };
    
    this.saveConversation(conversation);
    return conversation;
  }

  static addMessage(conversationId: string, userId: string, message: Omit<Message, 'id' | 'createdAt'>): void {
    try {
      const conversation = this.getConversation(conversationId, userId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      conversation.messages.push(newMessage);
      conversation.updatedAt = Date.now();
      
      if (conversation.messages.length === 1 && message.role === 'user') {
        conversation.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
      }
      
      this.saveConversation(conversation);
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }

  static deleteConversation(conversationId: string, userId: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const allConversations: Conversation[] = JSON.parse(stored);
      const filteredConversations = allConversations.filter(
        conv => !(conv.id === conversationId && conv.userId === userId)
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredConversations));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  static updateConversationTitle(conversationId: string, userId: string, title: string): void {
    try {
      const conversation = this.getConversation(conversationId, userId);
      if (!conversation) return;
      
      conversation.title = title;
      conversation.updatedAt = Date.now();
      this.saveConversation(conversation);
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  }
}
