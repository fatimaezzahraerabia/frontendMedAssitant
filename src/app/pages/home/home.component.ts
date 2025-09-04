import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatbotComponent } from '../../features/chatbot/chatbot.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, ChatbotComponent],

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomePageComponent {
  searchTerm: string = '';


}
