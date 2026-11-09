import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { AuthService } from '../../../../services/auth-service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  newUser: string = '';
  user?: string;

  redirecting = signal(false);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);


  checkLoggedUser() {
    AuthService.checkUser().subscribe({
      next: (userLogged) => {
        if (userLogged.length > 0) {
          this.user = userLogged;
          setTimeout(() => {
            this.redirecting.set(true);

            timer(5000)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.router.navigate(['/dashboard']);
              });
          }, 1500);
        }
      }
    });
  }

  createUser() {
    if (this.newUser.length>0) {
      AuthService.createUser(this.newUser).subscribe({
        next: (user) => {
          this.checkLoggedUser();
        }
      });
    }
  }

  logout() {
    AuthService.logout().subscribe({
      next: (loggedOut) => {
        this.checkLoggedUser();
      }
    });
  }

  ngOnInit(): void {
    this.checkLoggedUser();
  }
}
