import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { AuthService } from '../../../../services/auth-service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DateRangeConverted, DateRangePicker } from '../date-range-picker/date-range-picker';
import { DeviceInfo } from '../../../dashboard/components/dashboard/dashboard';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DateRangePicker, NgClass],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {

  @Output()
  onDateChangeEmitter = new EventEmitter<DateRangeConverted>();

  @Input() from!: Date;
  @Input() to!: Date;
  @Input() deviceInfo?: DeviceInfo;

  private router = inject(Router);

  user = signal('');

  onDateRangeChange(event: DateRangeConverted): void {
    this.onDateChangeEmitter.emit(event);
  }

  async logout(): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to log out?',
      icon: 'warning',
      reverseButtons: true,
      showCancelButton: true,
      confirmButtonColor: '#dc0028',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      this.doLogout();
    }
  }

  doLogout() {
    AuthService.logout().subscribe({
      next: () => {
        this.router.navigate(['']);
      }
    });
  }

  ngOnInit(): void {
    AuthService.checkUser().subscribe({
      next: (loggedUser) => {
        if (loggedUser.length>0) {
          this.user.set(loggedUser);
        } else {
          this.doLogout();
        }
      }
    });
  }

}
