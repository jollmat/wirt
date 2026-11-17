import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';

export interface VolcanoActivityReportInterface {
  source: string;
  title: string;
  kind: string;
  period: string;
  date: Date;
  link: string;
  reported_by: string;
  tier: string;
  lat: number;
  lon: number;
}

export interface VolcanoInterface {
  gvp: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  tier: string;
  reports: VolcanoActivityReportInterface[];
  cameras: number;
}

export interface VolcanoesInformationSourceInterface {
  key: string;
  name: string;
  url: string;
  licence: string;
  terms: string;
  ok: boolean;
  read_at: Date;
  published: unknown;
}

export interface VolcanoesInformationInterface {
  generated_at: Date;
  sources: VolcanoesInformationSourceInterface[];
  volcanoes: VolcanoInterface[];
}

@Injectable({
  providedIn: 'root',
})
export class VolcanoesService {
  private http = inject(HttpClient);

  getVolcanoes(): Observable<VolcanoInterface[]> {
    return this.http.get<VolcanoesInformationInterface>('https://signal.geoidinitiative.com/api/v1/volcanoes').pipe(map(
      (_res) => {
        return _res.volcanoes.map((_volcano) => {
          _volcano.reports = _volcano.reports.map((_volcanoReport) => {
            //_volcanoReport.link = 'https://volcano.si.edu';
            _volcanoReport.title = VolcanoesService.formatVolcanoName(_volcanoReport.title);
            return _volcanoReport;
          });
          return _volcano;
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching earthquakes:', error);
        console.error('HTTP status:', error.status);
        console.error('Error message:', error.message);
        return throwError(() => error);
      }));
  }

  public static formatVolcanoName(input: string) {
    const match = input.trim().match(/^(.+?)(?:\s+Volcano)?,\s*(.+)$/i);
    if (!match) return input.trim();
    return `${match[1].trim()} (${match[2].trim()})`;
  }

  public static toCommonEvent(event: VolcanoActivityReportInterface): CommonEventInterface {
    return {
      id: crypto.getRandomValues(new Uint32Array(1))[0],
      title: event.title,
      description: event.kind,
      lat: event.lat,
      lon:event.lon,
      type: 'volcano',
      time: event.date,
      origin: event.source,
      originIconId: 'volcanoes',
      link: event.link
    } as CommonEventInterface;
  }
}
