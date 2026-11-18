import { Component, Input, OnInit, output, signal } from '@angular/core';
import moment from 'moment';
import { CommonModule } from '@angular/common';

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

export interface DateRangeConverted {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss'
})
export class DateRangePicker implements OnInit{
  
  @Input() from!: Date;
  @Input() to!: Date;

  dateRangeChange = output<DateRangeConverted>();

  dateFrom = signal(
    moment(this.from).format('YYYY-MM-DD')
  );

  dateTo = signal(
    moment(this.to).format('YYYY-MM-DD')
  );

  get isToday(): boolean {
    const from = new Date(moment().format('YYYY-MM-DD'));
    const to = new Date(moment().format('YYYY-MM-DD'));
    const fromDate = new Date(this.dateFrom());
    const toDate = new Date(this.dateTo());
    return from.getDate()===fromDate.getDate() && 
      from.getMonth()===fromDate.getMonth() &&
      from.getFullYear()===fromDate.getFullYear() && 
      to.getDate()===toDate.getDate() && 
      to.getMonth()===toDate.getMonth() &&
      to.getFullYear()===toDate.getFullYear();
  }

  setToday(): void {
    const today = moment().format('YYYY-MM-DD');
    this.dateFrom.set(today);
    this.dateTo.set(today);
    this.onDateChange();
  }

  get isYesterday(): boolean {
    const from = new Date(moment().subtract(1, 'day').format('YYYY-MM-DD'));
    const to = new Date(moment().subtract(1, 'day').format('YYYY-MM-DD'));
    const fromDate = new Date(this.dateFrom());
    const toDate = new Date(this.dateTo());
    return from.getDate()===fromDate.getDate() && 
      from.getMonth()===fromDate.getMonth() &&
      from.getFullYear()===fromDate.getFullYear() && 
      to.getDate()===toDate.getDate() && 
      to.getMonth()===toDate.getMonth() &&
      to.getFullYear()===toDate.getFullYear();
  }

  setYesterday(): void {
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    this.dateFrom.set(yesterday);
    this.dateTo.set(yesterday);
    this.onDateChange();
  }

  get isLast7Days(): boolean {
    const from = new Date(moment().subtract(6, 'days').format('YYYY-MM-DD'));
    const to = new Date(moment().format('YYYY-MM-DD'));
    const fromDate = new Date(this.dateFrom());
    const toDate = new Date(this.dateTo());
    return from.getDate()===fromDate.getDate() && 
      from.getMonth()===fromDate.getMonth() &&
      from.getFullYear()===fromDate.getFullYear() && 
      to.getDate()===toDate.getDate() && 
      to.getMonth()===toDate.getMonth() &&
      to.getFullYear()===toDate.getFullYear();
  }

  setLast7Days(): void {
    this.dateFrom.set(moment().subtract(6, 'days').format('YYYY-MM-DD'));
    this.dateTo.set(moment().format('YYYY-MM-DD'));
    this.onDateChange();
  }

  get isLastMonth(): boolean {
    const from = new Date(moment().subtract(1, 'month').format('YYYY-MM-DD'));
    const to = new Date(moment().format('YYYY-MM-DD'));
    const fromDate = new Date(this.dateFrom());
    const toDate = new Date(this.dateTo());
    return from.getDate()===fromDate.getDate() && 
      from.getMonth()===fromDate.getMonth() &&
      from.getFullYear()===fromDate.getFullYear() && 
      to.getDate()===toDate.getDate() && 
      to.getMonth()===toDate.getMonth() &&
      to.getFullYear()===toDate.getFullYear();
  }

  setLastMonth(): void {
    this.dateFrom.set(moment().subtract(1, 'month').format('YYYY-MM-DD'));
    this.dateTo.set(moment().format('YYYY-MM-DD'));
    this.onDateChange();
  }

  private convertDateRange(range: DateRange): DateRangeConverted {
    return {
      from: new Date(`${range.dateFrom}T00:00:00`),
      to: new Date(`${range.dateTo}T23:59:59.999`)
    };
  }

  get momentToday(): string {
    return moment().format('YYYY-MM-DD');
  }

  onDateChange(): void {
    if (this.dateFrom() > this.dateTo()) {
      return;
    }
    this.dateRangeChange.emit(this.convertDateRange({
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo()
    }));
  }

  ngOnInit(): void {
    this.dateFrom.set(moment(this.from).format('YYYY-MM-DD'));
    this.dateTo.set(moment(this.to).format('YYYY-MM-DD'));this.onDateChange();
  }
}