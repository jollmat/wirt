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


export interface ApiServiceStatus {
  name: string;
  slug: string;
  description: string;
  category: string;
  status_url: string;
  current_status: string;
  last_checked: string;
  response_times: number[];
  uptime_days: UptimeDay[];
  recent_incidents: RecentIncident[];
  related: RelatedService[];
  monitoring_since: string;
  vendor_incidents: VendorIncident[];
  vendor_stats: VendorStats;
}

export interface UptimeDay {
  date: string;
  status: string;
  uptime_pct: number;
  source?: string;
}

export interface RecentIncident {
  id: number;
  from_status: string;
  to_status: string;
  timestamp: string;
}

export interface RelatedService {
  name: string;
  slug: string;
}

export interface VendorIncident {
  id: number;
  path: string;
  name: string;
  impact: string;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  url: string;
}

export interface VendorStats {
  window_start: string;
  incident_count: number;
  last_incident_at: string;
  median_duration_seconds: number;
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

  getApiCurrentStatus(slug: string): Observable<ApiServiceStatus> {
    return this.http.get<ApiServiceStatus>(`https://apistatus.watch/api/status/public/${slug}`);
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
      title: `<img src="https://apistatus.watch/api/badge/${event.slug}.svg" />`,
      description: `Current status: ${event.current_status}`,
      lat: 0,
      lon: 0,
      type: 'api status',
      time: event.requestedAt,
      origin: 'APIStatus.watch',
      originIconId: 'api-status',
      link: 'https://apistatus.watch/'
    } as CommonEventInterface;
  }
}
