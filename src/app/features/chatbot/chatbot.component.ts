<<<<<<< HEAD
import { Component, ElementRef, ViewChild, Renderer2, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // For API calls
import { RagService, ChatResponse } from '../../services/rag.service'; // Import ChatResponse
import { ChatbotService } from '../../services/chatbot.service'; // Import ChatbotService
import { ChatHistoryService, ChatMessage, Conversation } from '../../services/chat-history.service'; // Import ChatHistoryService and Conversation
import { marked } from 'marked'; // Import marked library
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe'; // Import SafeHtmlPipe
import { HistoryComponent } from '../../history/history.component'; // Import HistoryComponent
=======
import { Component, ElementRef, ViewChild, Renderer2, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // For API calls
// Removed unused RouterOutlet import

// Assuming ChatService will be created separately
// import { ChatService } from '../services/chat.service';
>>>>>>> bc13267 (init repo)

@Component({
  selector: 'app-chatbot',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, FormsModule, HttpClientModule, SafeHtmlPipe, HistoryComponent], // Ajouter SafeHtmlPipe et HistoryComponent ici
=======
  imports: [CommonModule, FormsModule, HttpClientModule], // Removed unused RouterOutlet
>>>>>>> bc13267 (init repo)
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chatbotModal') chatbotModal!: ElementRef;
  @ViewChild('chatbotToggleButton') chatbotToggleButton!: ElementRef;
<<<<<<< HEAD
  @ViewChild('chatHistory') chatHistory!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;

  isChatOpen: boolean = false; 
  isWaitingForResponse: boolean = false;
  tooltipVisible: boolean = true;
  conversationMode: 'diagnostic' | 'advice' | null = null;
  diagnosticStep: number = 0; // 0: initial, 1: asking for more symptoms, 2: symptoms provided
  sessionId: string = this.generateSessionId(); // Générer un ID de session unique
  showInitialOptions: boolean = true; // Contrôle l'affichage des options initiales
  public activeSection: 'chat' | 'history' = 'chat';
  
  chatMessages$: Observable<ChatMessage[]>; // Utiliser un Observable pour l'historique

  private chatSubscription: Subscription = new Subscription();
  private historySubscription: Subscription = new Subscription();


  constructor(
    private renderer: Renderer2, 
    private ragService: RagService, 
    private chatbotService: ChatbotService, 
    private chatHistoryService: ChatHistoryService, // Injecter le service d'historique
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.chatMessages$ = this.chatHistoryService.currentConversation$;
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  setActiveSection(section: 'chat' | 'history'): void {
    this.activeSection = section;
  }

  ngAfterViewInit(): void {
    this.setupEventListeners();
    // S'abonner à l'état d'ouverture du chat du service
    this.chatSubscription = this.chatbotService.isChatOpen$.subscribe(isOpen => {
      this.isChatOpen = isOpen;
      const modalElement = this.chatbotModal?.nativeElement;
      if (modalElement) {
        if (this.isChatOpen) {
          this.renderer.removeClass(modalElement, 'hidden');
          // Charger l'historique pour s'assurer que tout est à jour
          this.historySubscription = this.chatMessages$.subscribe(messages => {
            // Si l'historique est vide après le chargement, afficher les messages initiaux et les options
            if (messages.length === 0) {
              this.showInitialOptions = true;
            } else {
              this.showInitialOptions = false; // Si l'historique n'est pas vide, masquer les options initiales
            }
            this.scrollToBottom();
          });
        } else {
          this.renderer.addClass(modalElement, 'hidden');
          this.historySubscription.unsubscribe(); // Se désabonner lors de la fermeture
        }
      }
    });
  }

  getPastConversations(): Conversation[] {
    return this.chatHistoryService.getAllConversations() || [];
  }

  loadConversation(convo: Conversation): void {
    this.chatHistoryService.loadConversation(convo.id);
    this.showInitialOptions = false; // Masquer les options initiales lors du chargement d'une conversation
  }

  startNewConversation(): void {
    this.chatHistoryService.startNewConversation();
    this.showInitialOptions = true; // Afficher les options initiales pour une nouvelle conversation
=======
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
>>>>>>> bc13267 (init repo)
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
<<<<<<< HEAD
    this.chatSubscription.unsubscribe(); // Se désabonner pour éviter les fuites de mémoire
    this.historySubscription.unsubscribe();
=======
>>>>>>> bc13267 (init repo)
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
<<<<<<< HEAD
      console.log('Attaching click listener to close button'); // Debugging
      this.renderer.listen(closeButton, 'click', () => this.closeChat());
    } else {
      console.error('Close button not found in chatbot modal.'); // Debugging
    }
    if (chatForm) {
      // L'événement de soumission est maintenant géré dans le template
=======
      this.renderer.listen(closeButton, 'click', () => this.closeChat());
    }
    if (chatForm) {
      // Corrected event listener for submit to match expected signature and fix typo
      this.renderer.listen(chatForm, 'submit', (event: Event) => {
        this.handleChatSubmit(event);
        // Return false to prevent default form submission if needed, though event.preventDefault() handles it
        return false; 
      });
>>>>>>> bc13267 (init repo)
    }
  }

  private removeEventListeners(): void {
    // Clean up listeners if necessary, though Angular's lifecycle hooks often handle this
  }

<<<<<<< HEAD
  private addBotInitialMessagesAndOptions(): void {
    this.chatHistoryService.addMessage({
      text: 'Bonjour ! Je suis votre assistant médical virtuel, prêt à vous écouter. Comment puis-je vous accompagner aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date()
    });
    this.chatHistoryService.addMessage({
      text: 'Pour commencer, choisissez ce qui vous intéresse :',
      sender: 'bot',
      timestamp: new Date()
    });
    // Les boutons d'options seront gérés dans le template avec *ngIf="showInitialOptions"
  }

  selectOption(option: 'diagnostic' | 'advice'): void {
    let choiceText: string;
    let modelResponseText: string;

    this.showInitialOptions = false; // Masquer les options initiales une fois qu'une option est sélectionnée

    if (option === 'diagnostic') {
      choiceText = 'Obtenir un diagnostic';
      this.conversationMode = 'diagnostic';
      this.diagnosticStep = 0; // Réinitialiser l'étape de diagnostic
      
      this.chatHistoryService.addMessage({ text: choiceText, sender: 'user', timestamp: new Date() });

      // Envoyer une requête initiale au backend pour obtenir la première question dynamique
      this.isWaitingForResponse = true;
      const loadingMessage: ChatMessage = { text: '...', sender: 'bot', timestamp: new Date() };
      this.chatHistoryService.addMessage(loadingMessage);


      this.ragService.getDiagnosis([], this.sessionId).subscribe({
        next: (response: ChatResponse) => {
          if (response.message) {
            this.updateLastBotMessage(response.message);
          } else {
            this.updateLastBotMessage('Erreur: Aucune question de diagnostic reçue.');
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'appel API pour la première question de diagnostic:', error);
          this.updateLastBotMessage(`Erreur: ${error.message}`, true);
        },
        complete: () => {
          this.isWaitingForResponse = false;
        }
      });

    } else if (option === 'advice') {
      choiceText = 'Obtenir des conseils';
      this.conversationMode = 'advice';
      modelResponseText = 'D\'accord, je suis là pour vous donner des conseils généraux sur la santé. Veuillez me poser votre question ou me décrire la situation pour laquelle vous souhaitez des conseils.';
      this.chatHistoryService.addMessage({ text: choiceText, sender: 'user', timestamp: new Date() });
      this.chatHistoryService.addMessage({ text: modelResponseText, sender: 'bot', timestamp: new Date() });
    } else {
      return; // Should not happen with current options
    }
  }

  toggleChat(): void {
    console.log('toggleChat() called. Current isChatOpen:', this.isChatOpen); // Debugging
    this.chatbotService.toggleChat();
  }

  closeChat(): void {
    console.log('closeChat() called'); // Debugging
    this.chatbotService.closeChat();
    // Réinitialiser l'état du chatbot lors de la fermeture
    this.conversationMode = null;
    this.diagnosticStep = 0;
    this.sessionId = this.generateSessionId();
    this.showInitialOptions = true;
    this.chatHistoryService.clearCurrentConversation(); // Effacer l'historique de la conversation actuelle
  }

  private scrollToBottom(): void {
    try {
      if (this.chatHistory && this.chatHistory.nativeElement) {
        this.chatHistory.nativeElement.scrollTop = this.chatHistory.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }

  updateLastBotMessage(text: string, isError: boolean = false): void {
    const currentHistory = this.chatHistoryService.getCurrentConversationMessages();
    if (currentHistory.length > 0) {
      const lastMessage = currentHistory[currentHistory.length - 1];
      if (lastMessage.sender === 'bot' && lastMessage.text === '...') {
        const updatedMessage = { ...lastMessage, text: isError ? `<p class="text-red-700">Erreur: ${text}</p>` : text };
        this.chatHistoryService.updateMessage(currentHistory.length - 1, updatedMessage);
      } else {
        this.chatHistoryService.addMessage({ text: isError ? `<p class="text-red-700">Erreur: ${text}</p>` : text, sender: 'bot', timestamp: new Date() });
      }
    }
  }

  handleChatSubmit(event: Event): void {
=======
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
>>>>>>> bc13267 (init repo)
    event.preventDefault();
    if (this.isWaitingForResponse) return;

    const userInputElement = this.chatInput?.nativeElement;
    if (!userInputElement) return;

    const userMessageText = userInputElement.value.trim();
    if (!userMessageText) return;

<<<<<<< HEAD
    this.chatHistoryService.addMessage({ text: userMessageText, sender: 'user', timestamp: new Date() });
    userInputElement.value = '';

    if (this.conversationMode === null) {
      // Simple intent recognition: if user types symptoms, switch to diagnostic mode
      const symptomKeywords = ['mal', 'douleur', 'fièvre', 'toux', 'symptômes', 'je me sens'];
      const lowerCaseMessage = userMessageText.toLowerCase();
      const containsSymptomKeyword = symptomKeywords.some(keyword => lowerCaseMessage.includes(keyword));

      if (containsSymptomKeyword) {
        this.conversationMode = 'diagnostic';
        this.diagnosticStep = 0; // Réinitialiser l'étape de diagnostic
        this.showInitialOptions = false; // Masquer les options initiales
        this.chatHistoryService.addMessage({ text: 'D\'accord, je comprends que vous souhaitez un diagnostic.', sender: 'bot', timestamp: new Date() });
        // Envoyer une requête initiale au backend pour obtenir la première question
        this.isWaitingForResponse = true;
        const loadingMessage: ChatMessage = { text: '...', sender: 'bot', timestamp: new Date() };
        this.chatHistoryService.addMessage(loadingMessage);

        this.ragService.getDiagnosis([], this.sessionId).subscribe({
          next: (response: ChatResponse) => {
            if (response.message) {
              this.updateLastBotMessage(response.message);
            } else {
              this.updateLastBotMessage('Erreur: Aucune question de diagnostic reçue.');
            }
          },
          error: (error: any) => {
            console.error('Erreur lors de l\'appel API pour la première question de diagnostic:', error);
            this.updateLastBotMessage(`Erreur: ${error.message}`, true);
          },
          complete: () => {
            this.isWaitingForResponse = false;
          }
        });
      } else {
        this.chatHistoryService.addMessage({ text: 'Je suis votre assistant médical virtuel. Pour commencer, veuillez choisir une option : "Obtenir un diagnostic" ou "Obtenir des conseils".', sender: 'bot', timestamp: new Date() });
        this.isWaitingForResponse = false;
        return;
      }
    }

    if (this.conversationMode === 'diagnostic') {
      const loadingMessage: ChatMessage = { text: '...', sender: 'bot', timestamp: new Date() };
      this.chatHistoryService.addMessage(loadingMessage);
      this.isWaitingForResponse = true;

      const symptoms = [userMessageText]; // Envoyer la réponse de l'utilisateur comme un symptôme

      this.ragService.getDiagnosis(symptoms, this.sessionId).subscribe({
        next: (response: ChatResponse) => {
          if (response.message) {
            this.updateLastBotMessage(response.message);
            // Si le backend indique qu'il n'a plus besoin d'informations, réinitialiser le mode
            if (response.requires_more_info === false) {
              this.conversationMode = null;
              this.diagnosticStep = 0;
              this.sessionId = this.generateSessionId(); // Générer un nouvel ID de session
              this.showInitialOptions = true; // Afficher les options initiales
            }
          } else {
            this.updateLastBotMessage('Erreur: Réponse inattendue du diagnostic.', true);
            this.conversationMode = null;
            this.diagnosticStep = 0;
            this.sessionId = this.generateSessionId();
            this.showInitialOptions = true;
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'appel API:', error);
          this.updateLastBotMessage(`Erreur: ${error.message}`, true);
          this.conversationMode = null;
          this.diagnosticStep = 0;
          this.sessionId = this.generateSessionId();
          this.showInitialOptions = true;
        },
        complete: () => {
          this.isWaitingForResponse = false;
        }
      });
    } else if (this.conversationMode === 'advice') {
      const loadingMessage: ChatMessage = { text: '...', sender: 'bot', timestamp: new Date() };
      this.chatHistoryService.addMessage(loadingMessage);
      this.isWaitingForResponse = true;

      this.ragService.getAdvice(userMessageText).subscribe({
        next: (response: ChatResponse) => {
          const responseText = response.message || "Désolé, je n'ai pas pu trouver de conseils pour votre question. Veuillez reformuler.";
          this.updateLastBotMessage(responseText);
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'appel API pour les conseils:', error);
          this.updateLastBotMessage(`Erreur: ${error.message}`, true);
        },
        complete: () => {
          this.isWaitingForResponse = false;
        }
      });
    } else { // General conversation mode
      const loadingMessage: ChatMessage = { text: '...', sender: 'bot', timestamp: new Date() };
      this.chatHistoryService.addMessage(loadingMessage);
      this.isWaitingForResponse = true;

      this.ragService.getGeneralResponse(userMessageText).subscribe({
        next: (response: ChatResponse) => {
          const responseText = response.message || "Désolé, je n'ai pas pu trouver de réponse à votre question. Veuillez reformuler ou choisir une option.";
          this.updateLastBotMessage(responseText);
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'appel API pour la réponse générale:', error);
          this.updateLastBotMessage(`Erreur: ${error.message}`, true);
        },
        complete: () => {
          this.isWaitingForResponse = false;
        }
      });
=======
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
>>>>>>> bc13267 (init repo)
    }
  }
}
