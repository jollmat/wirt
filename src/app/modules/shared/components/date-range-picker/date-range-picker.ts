import { Component, Input, OnInit, output, signal } from '@angular/core';
import moment from 'moment';

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

  setToday(): void {
    const today = moment().format('YYYY-MM-DD');

    this.dateFrom.set(today);
    this.dateTo.set(today);

    this.onDateChange();
  }

  setYesterday(): void {
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

    this.dateFrom.set(yesterday);
    this.dateTo.set(yesterday);

    this.onDateChange();
  }

  setLast7Days(): void {
    this.dateFrom.set(
      moment().subtract(6, 'days').format('YYYY-MM-DD')
    );

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