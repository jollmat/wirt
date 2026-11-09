import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import SockJS from 'sockjs-client';
import { Observable, of, Subject } from 'rxjs';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';
import { EarthquakePerception, MagnitudeType, SeismicMetricsService } from './seismic-metrics-service';

export interface SeismicPortalEvent {
  action: string;
  data: {
    id: string;
    type: string;
    geometry: {
      type: string;
      coordinates: number[];
    };
    properties: {
      auth: string;
      depth: number;
      flynn_region: string;
      lastupdate: Date;
      lat: number;
      lon: number;
      mag: number;
      magtype: MagnitudeType;
      magTypeDesc: string;
      perception?: EarthquakePerception;
      source_catalog: string;
      source_id: string;
      time: Date;
      unid: string;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class SeismicPortalService implements OnDestroy {
  private seismicMetricsService = inject(SeismicMetricsService);

  STORED_SEISMIC_PORTAL_EVENTS_KEY = 'WIRT_STORED_SEISMIC_PORTAL_EVENTS_KEY';

  private zone = inject(NgZone);
  private socket: WebSocket | null = null;

  private eventsSubject = new Subject<SeismicPortalEvent>();
  events$ = this.eventsSubject.asObservable();

  connect(): void {

    if (this.socket) return;

    this.socket = new SockJS(
      'https://www.seismicportal.eu/standing_order'
    ) as unknown as WebSocket;

    this.socket.onopen = () => {
      console.log('Seismic service connected');
    };

    this.socket.onmessage = (event: MessageEvent) => {

      this.zone.run(() => {
        try {
          const eventItem = JSON.parse(event.data) as SeismicPortalEvent;
          eventItem.data.properties.mag = Math.abs(eventItem.data.properties.mag);
          eventItem.data.properties.magTypeDesc = this.getMagTypeDescription(eventItem.data.properties.magtype);
          eventItem.data.properties.perception = this.seismicMetricsService.getPerception(eventItem.data.properties.mag, eventItem.data.properties.magtype, Math.abs(eventItem.data.properties.depth));
          this.eventsSubject.next(eventItem);
          this.storeEvent(eventItem);
          console.log('Seismic event:', eventItem);
        } catch (error) {
          console.error('Invalid seismic JSON:', error);
        }
      });

    };

    this.socket.onclose = () => {
      console.log('Seismic service disconnected');
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error('Seismic service socket error:', error);
    };
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.eventsSubject.complete();
  }

  storeEvent(e: SeismicPortalEvent) {
    this.getStoredEvents().subscribe({
      next: (_events) => {
        _events.push(e);
        _events = [...new Set(_events)];
        localStorage.setItem(this.STORED_SEISMIC_PORTAL_EVENTS_KEY, JSON.stringify(_events));
      }
    });
  }

  getStoredEvents(): Observable<SeismicPortalEvent[]> {
    const eventsStr = localStorage.getItem(this.STORED_SEISMIC_PORTAL_EVENTS_KEY);
    let events:  SeismicPortalEvent[] = [];
    if (eventsStr) {
      events = JSON.parse(eventsStr) as SeismicPortalEvent[];
      const hasDuplicates = events.length !== new Set(events).size;
      if (hasDuplicates) {
        events = [...new Set(events)];
      }
      events = events.map((_event) => {
        _event.data.properties.depth = Math.abs(_event.data.properties.depth);
        _event.data.properties.mag = Math.abs(_event.data.properties.mag);
        _event.data.properties.magTypeDesc = this.getMagTypeDescription(_event.data.properties.magtype);
        _event.data.properties.perception = this.seismicMetricsService.getPerception(_event.data.properties.mag, _event.data.properties.magtype, _event.data.properties.depth);
        if (typeof _event.data.properties.lastupdate === 'string') {
          _event.data.properties.lastupdate = new Date(_event.data.properties.lastupdate);
        }
        return _event;
      });
    }
    return of(events);
  }


  private getMagTypeDescription(magType: string) {
    const typeItem = SeismicMetricsService.magTypesDescs.find((_typeDesc) => {
      return _typeDesc.mType.toLowerCase() === magType.toLowerCase();
    });
    return typeItem ? `${magType} - ${typeItem.desc}` : magType;
  }

  public static toCommonEvent(event: SeismicPortalEvent): CommonEventInterface {
    return {
      id: event.data.id,
      title: event.data.properties.flynn_region,
      description: `Earthquake with magnitude ${event.data.properties.mag} ${event.data.properties.magtype} in ${event.data.properties.flynn_region}`,
      lat: event.data.geometry.coordinates[0],
      lon: event.data.geometry.coordinates[1],
      type: 'earthquake',
      time: event.data.properties.lastupdate,
      origin: 'Seismic Portal',
      originIconId: 'earthQuakes',
      link: `https://www.seismicportal.eu/`
    } as CommonEventInterface;
  }
}