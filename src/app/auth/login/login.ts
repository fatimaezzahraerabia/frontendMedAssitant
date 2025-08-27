import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          console.log('✅ Connexion réussie', res);
          this.message = "Connexion réussie";

          // Assumant que la réponse 'res' contient un objet 'user' avec 'role'
          // Ajustez selon la structure réelle de la réponse de votre API
          const role = res.role || 'USER'; 

          if (role === 'ADMINISTRATEUR') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['']);
          }
        },
        error: (err) => {
          console.error('❌ Erreur connexion', err);
          this.message = "Email ou mot de passe incorrect";
        }
      });
    }
  }
}