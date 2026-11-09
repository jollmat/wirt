import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  static STORAGE_USER = signal('WIRT_USER');

  static user = new BehaviorSubject<string>('');

  static checkUser(): Observable<string> {
    const storedUser = localStorage.getItem(this.STORAGE_USER());
    this.user.next((storedUser && storedUser.trim().length>0) ? storedUser.trim() : '');
    return of(this.user.getValue());
  }

  static createUser(user: string): Observable<string> {
    if (user.length>0) {
      localStorage.setItem(this.STORAGE_USER(), user);
      this.user.next(user);
    }
    return of(user);
  }

  static logout(): Observable<boolean> {
    this.user.next('');
    localStorage.removeItem(this.STORAGE_USER());
    return of(true);
  }
  
}
