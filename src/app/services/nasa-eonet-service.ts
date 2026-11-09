import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { NasaEonetEventInterface } from '../model/nasa-eonet/interfaces/nasa-eonet-event.interface';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';

@Injectable({
  providedIn: 'root',
})
export class NasaEonetService {
  private http = inject(HttpClient);

  getNaturalEvents(dateFrom: Date, dateTo: Date): Observable<NasaEonetEventInterface[]> {
  
    function formatLocalDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    const dateToString = `${formatLocalDate(dateTo)}`;
    const dateFromString = `${formatLocalDate(dateFrom)}`;

    return this.http.get<{events: NasaEonetEventInterface[]}>(`https://eonet.gsfc.nasa.gov/api/v3/events?start=${dateFromString}&end=${dateToString}`)
    .pipe(
      map((_res) => {
        return _res.events;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching nature events:', error);
        console.error('HTTP status:', error.status);
        console.error('Error message:', error.message);
        return throwError(() => error);
      })
    );
  }

  public static getHighestDate(
      geometry: any[],
      dateFrom: Date,
      dateTo: Date
  ): Date | null {
    const dates = geometry
      .map(item => new Date(item.date))
      .filter(date =>
        date >= dateFrom && date <= dateTo
      );

    if (!dates.length) {
      return null;
    }
    return new Date(Math.max(...dates.map(date => date.getTime())));
  }

  public static toCommonEvent(event: NasaEonetEventInterface, dateFrom: Date, dateTo: Date): CommonEventInterface {
    return {
      id: event.id,
      title: event.categories[0].title,
      description: event.categories[0].title,
      lat: event.geometry[0].coordinates[1],
      lon:event.geometry[0].coordinates[0],
      type: event.categories[0].title,
      time: NasaEonetService.getHighestDate(event.geometry, dateFrom, dateTo),
      origin: 'NASA EONET',
      originIconId: 'natureEvents',
      link: event.link
    } as CommonEventInterface;
  }
  
}