import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';

export type ApiStatusType = 'partial_outage' | 'degraded' | 'operational' | 'unknown' | 'major_outage';

export interface ApiStatusInterface {
  requestedAt: Date,
  name: string,
  slug: string,
  category: string,
  current_status: ApiStatusType
}

@Injectable({
  providedIn: 'root',
})
export class ApiStatusService {
  private http = inject(HttpClient);

  getApis(): Observable<ApiStatusInterface[]> {
    return this.http.get<{total: number, apis: ApiStatusInterface[]}>('https://apistatus.watch/api/status/directory').pipe(
      map((_response) => {
        return (_response.apis as ApiStatusInterface[]).map((_api) => {
          _api.requestedAt = new Date();
          return _api;
        });
      })
    );
  }

  public static getApiStatusTypeDescription(currentStatus: ApiStatusType): string {
    let desc = '';
    switch(currentStatus) {
      case 'unknown':
        desc = 'The current status cannot be reliably determined. For example, the provider\'s status page may be unavailable or not provide usable status information.';
        break;
      case 'operational':
        desc = 'The service is working normally. No reported incidents affecting its operation.';
        break;
      case 'degraded':
        desc = 'The service is available, but users may experience slower responses, increased latency or intermittent errors.';
        break;
      case 'partial_outage':
        desc = 'Some features, components or regions are unavailable, while other parts of the service continue working.';
        break;
      case 'major_outage':
        desc = 'A substantial part or the entirety of the service is unavailable or severely disrupted.';
        break;
    }
    return desc;
  }

  public static toCommonEvent(event: ApiStatusInterface): CommonEventInterface {
    return {
      id: crypto.getRandomValues(new Uint32Array(1))[0],
      title: event.name,
      description: `Current status: ${event.current_status}`,
      lat: -1,
      lon: -1,
      type: 'api status',
      time: event.requestedAt,
      origin: 'APIStatus.watch',
      originIconId: 'api-status',
      link: 'https://apistatus.watch/'
    } as CommonEventInterface;
  }
}
