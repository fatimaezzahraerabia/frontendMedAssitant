import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatHistoryService, Conversation, ChatMessage } from '../services/chat-history.service'; // Import necessary types

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule for ngModel
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  allConversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  searchTerm: string = '';
  @Output() conversationSelected = new EventEmitter<void>();

  private conversationsSubscription: Subscription | undefined;

  constructor(
    private chatHistoryService: ChatHistoryService
  ) {}

  ngOnInit(): void {
    this.conversationsSubscription = this.chatHistoryService.allConversations$.subscribe(conversations => {
      this.allConversations = conversations;
      this.filterConversations(); // Initial filter
    });
  }

  ngOnDestroy(): void {
    this.conversationsSubscription?.unsubscribe();
  }

  filterConversations(): void {
    if (!this.searchTerm) {
      this.filteredConversations = this.allConversations;
    } else {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      this.filteredConversations = this.allConversations.filter(convo =>
        convo.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        convo.messages.some(msg => msg.text.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
  }

  loadConversation(conversationId: string): void {
    this.chatHistoryService.loadConversation(conversationId);
    this.conversationSelected.emit();
  }

  // Method to display a snippet of the conversation for history list
  getConversationSnippet(conversation: Conversation): string {
    if (conversation.messages.length === 0) {
      return 'No messages yet';
    }
    // Display the title or the first user message as a snippet
    if (conversation.title && conversation.title !== 'Nouvelle conversation') {
      return conversation.title;
    } else {
      const firstUserMessage = conversation.messages.find(msg => msg.sender === 'user');
      if (firstUserMessage) {
        return firstUserMessage.text.substring(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');
      } else {
        return 'Conversation started';
      }
    }
  }
}
