import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { NasaEonetEventInterface, NasaNatureEventInterface } from '../model/nasa-eonet/interfaces/nasa-eonet-event.interface';
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

  public static toCommonEvent(event: NasaNatureEventInterface): CommonEventInterface {
    return {
      id: crypto.getRandomValues(new Uint32Array(1))[0],
      title: event.title,
      description: event.description?.length>0 ? event.description : '',
      lat: event.coordinates[1],
      lon: event.coordinates[0],
      type: event.type,
      time: event.date,
      origin: 'NASA EONET',
      originIconId: 'natureEvents',
      link: event.url
    } as CommonEventInterface;
  }
  
}