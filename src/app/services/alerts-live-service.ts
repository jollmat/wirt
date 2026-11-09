import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { AlertsLiveEventInterface } from '../model/alerts-live/alerts-live-event.interface';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';

@Injectable({
  providedIn: 'root',
})

export class AlertsLiveService {
  private http = inject(HttpClient);

  WIRT_STORED_ALERTSLIVE = 'WIRT_STORED_ALERTSLIVE';

  lastRequestDate?: Date;

  getAlertsLiveEvents(dateFrom: Date, dateTo: Date): Observable<AlertsLiveEventInterface[]> {
    return this.http.get<{events: AlertsLiveEventInterface[]}>(`https://alerts.live/api/v1/events?format=json&limit=1000`)
        .pipe(
          map((_res) => {
            this.lastRequestDate = new Date();
            localStorage.setItem(this.WIRT_STORED_ALERTSLIVE, JSON.stringify(_res.events));
            return _res.events;
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error fetching alerts:', error);
            console.error('HTTP status:', error.status);
            console.error('Error message:', error.message);
            if (error.status && error.status===429) {
              const storedAlerts: AlertsLiveEventInterface[] = this.getStoredAlertLiveEvents();
              if (storedAlerts) {
                return of(storedAlerts);
              }
            }
            return throwError(() => error);
          })
        );
  }

  getStoredAlertLiveEvents(): AlertsLiveEventInterface[] {
    const storedAlertsLive = localStorage.getItem(this.WIRT_STORED_ALERTSLIVE);
      if (storedAlertsLive) {
        const storedAlerts = JSON.parse(storedAlertsLive) as AlertsLiveEventInterface[];
        if (storedAlerts) {
          return storedAlerts;
        }
      }
      return [];
  }

  public static toCommonEvent(event: AlertsLiveEventInterface): CommonEventInterface {
    return {
      id: event.id,
      title: event.title,
      description: '',
      lat: event.lat,
      lon: event.lon,
      type: event.type,
      time: event.last_seen,
      origin: 'Alerts Live',
      originIconId: 'alertsLive',
      link: event.url
    } as CommonEventInterface;
  }
  
}
