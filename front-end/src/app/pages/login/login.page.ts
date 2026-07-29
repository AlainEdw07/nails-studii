import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  correo = '';
  contrasena = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.errorMessage = '';

    if (!this.correo || !this.contrasena) {
      this.errorMessage = 'Por favor completa el correo y la contraseña.';
      return;
    }

    this.isLoading = true;
    this.authService.login(this.correo, this.contrasena).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.isLoading = false;
        const serverMessage = error?.error?.mensaje;
        const validationErrors = error?.error?.errores;

        if (validationErrors) {
          const messages = Object.values(validationErrors).map((value) =>
            Array.isArray(value) ? value.join(' ') : String(value),
          );
          this.errorMessage = messages.join(' ');
        } else {
          this.errorMessage = serverMessage || 'No se pudo iniciar sesión. Revisa tus datos.';
        }
      },
    });
  }
}
