import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { CityAlertIncidentInterface } from '../model/city-alert/city-alert-incident.interface';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';

@Injectable({
  providedIn: 'root',
})
export class CityAlertLiveService {
  private http = inject(HttpClient);

  static CLOUDFLARE_WORKER_CORS_URL = 'https://fragrant-shape-d81c.joanlloria.workers.dev';

  getCityAlertIncidents(dateFrom: Date, dateTo: Date): Observable<CityAlertIncidentInterface[]> {

    function formatLocalDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    const dateToString = `${formatLocalDate(dateTo)}T23:59:59Z`;
    const dateFromString = `${formatLocalDate(dateFrom)}T00:00:00Z`;

    const encodedUri = encodeURIComponent(`https://cityalert.live/api/incidents?format=json&from=${dateFromString}&to=${dateToString}`);

    return this.http.get<{incidents: CityAlertIncidentInterface[]}>(`${CityAlertLiveService.CLOUDFLARE_WORKER_CORS_URL}?url=${encodedUri}`)
        .pipe(
          map((_res) => {
            return CityAlertLiveService.filterByDateRange(_res.incidents, dateFrom, dateTo);
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error fetching incidents:', error);
            console.error('HTTP status:', error.status);
            console.error('Error message:', error.message);
            return throwError(() => error);
          })
        );
  }

  private static filterByDateRange(
    incidents: CityAlertIncidentInterface[],
    dateFrom: Date,
    dateTo: Date
  ): CityAlertIncidentInterface[] {

    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);

    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    return incidents.filter(incident => {
      const time = new Date(incident.time).getTime();

      return time >= from.getTime() && time <= to.getTime();
    });
  }

  public static toCommonEvent(event: CityAlertIncidentInterface): CommonEventInterface {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      lat: event.lat,
      lon: event.lon,
      type: event.type,
      category: event.category || '',
      time: event.time,
      origin: 'City Alert Live',
      originIconId: 'cityAlert',
      link: event.url
    } as CommonEventInterface;
  }
  
}