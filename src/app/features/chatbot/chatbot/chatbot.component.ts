import { Component, ElementRef, ViewChild, Renderer2, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // For API calls
// Removed unused RouterOutlet import

// Assuming ChatService will be created separately
// import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], // Removed unused RouterOutlet
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chatbotModal') chatbotModal!: ElementRef;
  @ViewChild('chatbotToggleButton') chatbotToggleButton!: ElementRef;
  // @ViewChild('chatHistory') chatHistory!: ElementRef; // Removed redundant ViewChild
  @ViewChild('chatInput') chatInput!: ElementRef;

  isChatOpen: boolean = false;
  isWaitingForResponse: boolean = false;

  // Placeholder for API key - should be managed securely (e.g., environment variables)
  private readonly apiKey: string = ""; // Replace with your actual API key or use environment variables
  private readonly apiUrl: string = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.apiKey}`;

  constructor(private renderer: Renderer2, private http: HttpClient) {}

  ngAfterViewInit(): void {
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    const toggleButton = this.chatbotToggleButton?.nativeElement;
    const modalElement = this.chatbotModal?.nativeElement;
    const closeButton = modalElement?.querySelector('#close-chatbot-button');
    const chatForm = modalElement?.querySelector('#chat-form');

    if (toggleButton) {
      this.renderer.listen(toggleButton, 'click', () => this.toggleChat());
    }
    if (closeButton) {
      this.renderer.listen(closeButton, 'click', () => this.closeChat());
    }
    if (chatForm) {
      // Corrected event listener for submit to match expected signature and fix typo
      this.renderer.listen(chatForm, 'submit', (event: Event) => {
        this.handleChatSubmit(event);
        // Return false to prevent default form submission if needed, though event.preventDefault() handles it
        return false; 
      });
    }
  }

  private removeEventListeners(): void {
    // Clean up listeners if necessary, though Angular's lifecycle hooks often handle this
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    const modalElement = this.chatbotModal?.nativeElement;
    if (modalElement) {
      if (this.isChatOpen) {
        this.renderer.removeClass(modalElement, 'hidden');
      } else {
        this.renderer.addClass(modalElement, 'hidden');
      }
    }
  }

  closeChat(): void {
    this.isChatOpen = false;
    const modalElement = this.chatbotModal?.nativeElement;
    if (modalElement) {
      this.renderer.addClass(modalElement, 'hidden');
    }
  }

  addMessageToChat(role: string, text: string): HTMLDivElement {
    const chatHistoryElement = document.getElementById('chat-history');
    if (!chatHistoryElement) {
      console.error("Chat history element not found!");
      return document.createElement('div');
    }

    const messageDiv = this.renderer.createElement('div');
    this.renderer.addClass(messageDiv, 'flex');
    this.renderer.addClass(messageDiv, 'mb-2');
    this.renderer.addClass(messageDiv, role === 'user' ? 'justify-end' : 'justify-start');

    const messageBubble = this.renderer.createElement('div');
    let bubbleClasses = 'p-3 rounded-xl shadow-md max-w-[80%] ';
    if (role === 'user') {
      bubbleClasses += 'bg-blue-600 text-white rounded-br-none';
    } else {
      bubbleClasses += 'bg-white text-gray-800 rounded-bl-none';
    }
    this.renderer.addClass(messageBubble, bubbleClasses);

    if (text === '...') {
      messageBubble.innerHTML = `<div class="flex items-center space-x-2"><div class="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div><div class="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-75"></div><div class="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-150"></div></div>`;
    } else {
      messageBubble.innerText = text;
    }

    this.renderer.appendChild(messageDiv, messageBubble);
    this.renderer.appendChild(chatHistoryElement, messageDiv);
    chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
    return messageDiv; // Return the created message div
  }

  updateLoadingMessage(messageElement: HTMLDivElement, role: string, text: string): void {
    if (!messageElement) return; // Safety check

    if (role === 'model') {
      this.renderer.removeClass(messageElement, 'bg-red-100');
      this.renderer.removeClass(messageElement, 'text-red-700');
      this.renderer.addClass(messageElement, 'bg-white');
      this.renderer.addClass(messageElement, 'text-gray-800');
      this.renderer.addClass(messageElement, 'rounded-bl-none');
      messageElement.innerHTML = `<p>${text}</p>`;
    } else if (role === 'error') {
      this.renderer.removeClass(messageElement, 'bg-white');
      this.renderer.removeClass(messageElement, 'text-gray-800');
      this.renderer.addClass(messageElement, 'bg-red-100');
      this.renderer.addClass(messageElement, 'text-red-700');
      this.renderer.addClass(messageElement, 'rounded-bl-none');
      messageElement.innerHTML = `<p>Erreur: ${text}</p>`;
    }
  }

  async handleChatSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isWaitingForResponse) return;

    const userInputElement = this.chatInput?.nativeElement;
    if (!userInputElement) return;

    const userMessageText = userInputElement.value.trim();
    if (!userMessageText) return;

    this.addMessageToChat('user', userMessageText);
    userInputElement.value = '';

    const initialAssistantMessage = { role: "model", parts: [{ text: "Bonjour, comment puis-je vous aider à trouver un médecin ?" }] };
    const userMessageForApi = { role: "user", parts: [{ text: userMessageText }] };

    const apiPayloadContents = [initialAssistantMessage, userMessageForApi];

    // Ensure loadingMessageElement is correctly typed and assigned
    const loadingMessageElement: HTMLDivElement = this.addMessageToChat('model', '...');
    this.isWaitingForResponse = true;

    try {
      if (!this.apiKey) {
        throw new Error("API key is missing. Please set your API key in the component or environment variables.");
      }
      const payload = { contents: apiPayloadContents };

      // Using HttpClient to make the POST request
      // .toPromise() is deprecated, but for simplicity in this context, it might work.
      // A better approach would be to use .subscribe() or async/await with fetch.
      const response = await this.http.post<any>(this.apiUrl, payload).toPromise();

      const assistantResponse = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (assistantResponse) {
        this.updateLoadingMessage(loadingMessageElement, 'model', assistantResponse);
      } else {
        this.updateLoadingMessage(loadingMessageElement, 'error', 'Pas de réponse valide.');
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'appel API:', error);
      this.updateLoadingMessage(loadingMessageElement, 'error', `Erreur: ${error.message}`);
    } finally {
      this.isWaitingForResponse = false;
    }
  }
}
