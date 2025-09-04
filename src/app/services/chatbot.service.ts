import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private isChatOpenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isChatOpen$: Observable<boolean> = this.isChatOpenSubject.asObservable();

  constructor() { }

  toggleChat(): void {
    this.isChatOpenSubject.next(!this.isChatOpenSubject.value);
  }

  openChat(): void {
    this.isChatOpenSubject.next(true);
  }

  closeChat(): void {
    this.isChatOpenSubject.next(false);
  }

  getChatHistory(): { role: string, text: string }[] | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedHistory = localStorage.getItem('chatbotHistory');
      return storedHistory ? JSON.parse(storedHistory) : null;
    }
    return null;
  }

  saveChatHistory(history: { role: string, text: string }[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('chatbotHistory', JSON.stringify(history));
    }
  }
}
