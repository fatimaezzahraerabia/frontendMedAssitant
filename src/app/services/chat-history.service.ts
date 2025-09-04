import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatHistoryService {
  private currentConversationSubject: BehaviorSubject<ChatMessage[]> = new BehaviorSubject<ChatMessage[]>([]);
  public currentConversation$: Observable<ChatMessage[]> = this.currentConversationSubject.asObservable();

  private allConversationsSubject: BehaviorSubject<Conversation[]> = new BehaviorSubject<Conversation[]>([]);
  public allConversations$: Observable<Conversation[]> = this.allConversationsSubject.asObservable();

  private currentConversationId: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllConversations();
      // Si aucune conversation n'est active, démarrer une nouvelle
      if (this.allConversationsSubject.getValue().length === 0) {
        this.startNewConversation();
      } else {
        // Charger la dernière conversation active ou la première si aucune n'est marquée comme active
        const lastActiveConvoId = localStorage.getItem('lastActiveConversationId');
        if (lastActiveConvoId) {
          this.loadConversation(lastActiveConvoId);
        } else {
          this.loadConversation(this.allConversationsSubject.getValue()[0].id);
        }
      }
    }
  }

  private generateConversationId(): string {
    return 'convo_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadAllConversations(): void {
    const storedConversations = localStorage.getItem('allConversations');
    if (storedConversations) {
      const conversations: Conversation[] = JSON.parse(storedConversations).map((convo: Conversation) => ({
        ...convo,
        timestamp: new Date(convo.timestamp) // Convertir la chaîne de date en objet Date
      }));
      this.allConversationsSubject.next(conversations);
    }
  }

  private saveAllConversations(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('allConversations', JSON.stringify(this.allConversationsSubject.getValue()));
    }
  }

  startNewConversation(): void {
    const newConversation: Conversation = {
      id: this.generateConversationId(),
      title: 'Nouvelle conversation',
      messages: [],
      timestamp: new Date()
    };
    const allConversations = [...this.allConversationsSubject.getValue(), newConversation];
    this.allConversationsSubject.next(allConversations);
    this.saveAllConversations();
    this.loadConversation(newConversation.id);
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.currentConversationSubject.getValue();
    const updatedMessages = [...currentMessages, message];
    this.currentConversationSubject.next(updatedMessages);

    if (this.currentConversationId) {
      const allConversations = this.allConversationsSubject.getValue();
      const convoIndex = allConversations.findIndex(c => c.id === this.currentConversationId);
      if (convoIndex > -1) {
        allConversations[convoIndex].messages = updatedMessages;
        // Mettre à jour le titre si c'est le premier message de l'utilisateur dans cette conversation
        if (message.sender === 'user' && updatedMessages.length === 1) {
          allConversations[convoIndex].title = message.text.substring(0, 30) + (message.text.length > 30 ? '...' : '');
        }
        this.allConversationsSubject.next([...allConversations]); // Émettre une nouvelle référence pour la détection des changements
        this.saveAllConversations();
      }
    }
  }

  updateMessage(index: number, updatedMessage: ChatMessage): void {
    const currentMessages = this.currentConversationSubject.getValue();
    if (index >= 0 && index < currentMessages.length) {
      const updatedMessages = [...currentMessages];
      updatedMessages[index] = updatedMessage;
      this.currentConversationSubject.next(updatedMessages);

      if (this.currentConversationId) {
        const allConversations = this.allConversationsSubject.getValue();
        const convoIndex = allConversations.findIndex(c => c.id === this.currentConversationId);
        if (convoIndex > -1) {
          allConversations[convoIndex].messages = updatedMessages;
          this.allConversationsSubject.next([...allConversations]);
          this.saveAllConversations();
        }
      }
    }
  }

  loadConversation(conversationId: string): void {
    const allConversations = this.allConversationsSubject.getValue();
    const conversation = allConversations.find(c => c.id === conversationId);
    if (conversation) {
      this.currentConversationSubject.next(conversation.messages);
      this.currentConversationId = conversationId;
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('lastActiveConversationId', conversationId);
      }
    } else {
      console.warn(`Conversation with ID ${conversationId} not found.`);
      this.startNewConversation(); // Démarrer une nouvelle si l'ID n'est pas trouvé
    }
  }

  clearCurrentConversation(): void {
    this.currentConversationSubject.next([]);
    if (this.currentConversationId) {
      const allConversations = this.allConversationsSubject.getValue();
      const convoIndex = allConversations.findIndex(c => c.id === this.currentConversationId);
      if (convoIndex > -1) {
        allConversations[convoIndex].messages = [];
        allConversations[convoIndex].title = 'Nouvelle conversation'; // Réinitialiser le titre
        this.allConversationsSubject.next([...allConversations]);
        this.saveAllConversations();
      }
    }
  }

  getAllConversations(): Conversation[] {
    return this.allConversationsSubject.getValue();
  }

  getCurrentConversationMessages(): ChatMessage[] {
    return this.currentConversationSubject.getValue();
  }
}
