import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],            // ✅ tu ajoutes ici

  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      motDePasse: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.registerPatient(this.registerForm.value).subscribe({
        next: (res) => {
          console.log('✅ Registration successful', res);
          this.message = "Inscription réussie ! Vous pouvez maintenant vous connecter.";
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('❌ Registration error', err);
          this.message = err.error || "Erreur lors de l'inscription.";
        }
      });
    }
  }
}
