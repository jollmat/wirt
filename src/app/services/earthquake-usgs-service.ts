import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { EarthquakeFeatureUsgsInterface } from '../model/earthquake-usgs/interfaces/earthquake-feature-usgs.interface';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';
import { SeismicMetricsService } from './seismic-metrics-service';

@Injectable({
  providedIn: 'root',
})
export class EarthquakeUsgsService {
  private http = inject(HttpClient);
  private seismicMetricsService = inject(SeismicMetricsService);

  getEarthQuakes(dateFrom: Date, dateTo: Date): Observable<EarthquakeFeatureUsgsInterface[]> {

    function formatLocalDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    const dateToString = formatLocalDate(dateTo);
    const dateFromString = formatLocalDate(dateFrom);

    return this.http.get<{features: EarthquakeFeatureUsgsInterface[]}>(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${dateFromString}&endtime=${dateToString}`)
    .pipe(
      map((_res) => {
        return _res.features.map((_feature) => {
          _feature.properties.mag = Math.abs(_feature.properties.mag);
          _feature.properties.magTypeDesc = this.getMagTypeDescription(_feature.properties.magType);
          _feature.properties.perception = this.seismicMetricsService.getPerception(_feature.properties.mag, _feature.properties.magType, Math.abs(_feature.geometry.coordinates[2]));
          return _feature;
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching earthquakes:', error);
        console.error('HTTP status:', error.status);
        console.error('Error message:', error.message);
        return throwError(() => error);
      })
    );
  }

  private static getHighestDate(
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

  public static toCommonEvent(event: EarthquakeFeatureUsgsInterface): CommonEventInterface {
    return {
      id: event.id,
      title: event.properties.place,
      description: event.properties.title,
      lat: event.geometry.coordinates[1],
      lon:event.geometry.coordinates[0],
      type: 'earthquake',
      time: event.properties.time,
      origin: 'USGS',
      originIconId: 'earthQuakes',
      link: event.properties.url
    } as CommonEventInterface;
  }

  private getMagTypeDescription(magType: string) {
    const typeItem = SeismicMetricsService.magTypesDescs.find((_typeDesc) => {
      return _typeDesc.mType.toLowerCase() === magType.toLowerCase();
    });
    return typeItem ? `${magType} - ${typeItem.desc}` : magType;
  }
}
