import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { OpenStreetmapService } from './open-streetmap-service';
import { CommonEventInterface } from '../model/common/interfaces/common-event.interface';

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: CurrentWeatherUnits;
  current: CurrentWeather;
  daily_units: DailyWeatherUnits;
  daily: DailyWeather;
}

export interface CurrentWeatherUnits {
  time: string;
  interval: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  apparent_temperature: string;
  is_day: string;
  precipitation: string;
  weather_code: string;
  wind_speed_10m: string;
}

export interface CurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface DailyWeatherUnits {
  time: string;
  weather_code: string;
  temperature_2m_max: string;
  temperature_2m_min: string;
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

export interface OpenMeteoLocation {
  lat: number;
  lon: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class OpenMeteoService implements OnDestroy {

  WIRT_STORED_LOCATIONS = 'WIRT_STORED_LOCATIONS';

  private openStreetmapService = inject(OpenStreetmapService);

  locations$ = new BehaviorSubject<OpenMeteoLocation[] | undefined>(undefined);
  userLocation$ = new BehaviorSubject<OpenMeteoLocation | undefined>(undefined);

  userCoordsSubscription?: Subscription;
  userLocationSubscription?: Subscription;

  constructor(private http: HttpClient) {

    this.locations$.subscribe((_locations) => {
      if (_locations) {
        this.storeLocations(_locations, 'OpenMeteoService.constructor');
      }
    });

    this.loadUserLocation().subscribe({
      next: () => {}
    });
  }
  
  private static getUserCoords(): Observable<{latitude: number, longitude: number} | undefined> {
    return new Observable<{latitude: number, longitude: number} | undefined>((observer) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          observer.next(undefined);
          observer.complete();
        }
      );
    });
  }

  getForecast(lat: number, lon: number): Observable<WeatherResponse> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    return this.http.get<WeatherResponse>(url);
  }

  getForecasts(locations?: OpenMeteoLocation[]): Observable<{location: OpenMeteoLocation, forecast: WeatherResponse}[]> {
    if (!locations) {
      locations = this.locations$.getValue() as OpenMeteoLocation[];
    }
    const userLocation = this.userLocation$.getValue();
    if (locations.length===0 && userLocation) {
      locations = [userLocation];
    }
    return forkJoin(
      locations.map(location =>
        this.getForecast(location.lat, location.lon).pipe(
          map(forecast => ({
            location,
            forecast
          }))
        )
      )
    );
  }

  /* Stored locations */
  loadStoredLocations() {
    this.locations$.next(this.getStoredLocations());
  }

  getStoredLocations(): OpenMeteoLocation[] {
    const storedLocationsStr = localStorage.getItem(this.WIRT_STORED_LOCATIONS);
    if (storedLocationsStr) {
      return JSON.parse(storedLocationsStr) as OpenMeteoLocation[];
    }
    return [];
  }

  removeOpenMeteoLocation(location: OpenMeteoLocation): Observable<boolean> {
    const locations = (this.locations$.getValue() || []).filter((_location) => {
      return _location.name!==location.name;
    });
    this.locations$.next(locations);
    return of(true);
  }

  storeLocation(location: OpenMeteoLocation): Observable<boolean> {
    const locations = this.getStoredLocations();
    locations.push(location);
    this.locations$.next(locations);
    return of(true);
  }

  storeLocations(locations: OpenMeteoLocation[], from: string) {
    if (locations) {
      localStorage.setItem(this.WIRT_STORED_LOCATIONS, JSON.stringify(locations));
    }
  }

  loadUserLocation(): Observable<boolean> {
    return OpenMeteoService.getUserCoords().pipe(
      switchMap((_userCoords): Observable<boolean> => {
        if (!_userCoords?.latitude || !_userCoords?.longitude) {
          return of(false);
        }

        return this.openStreetmapService
          .getAddress(_userCoords.latitude, _userCoords.longitude)
          .pipe(
            map((_userLocation): boolean => {
              this.userLocation$.next({
                name: _userLocation.address.town,
                lat: _userCoords.latitude,
                lon: _userCoords.longitude
              });
              return true;
            })
          );
      }),
      catchError((): Observable<boolean> => of(false))
    );
  }
  /* End Stored locations */

  public static toCommonEvent(event: {location: OpenMeteoLocation, forecast: WeatherResponse}): CommonEventInterface {
      return {
        id: crypto.getRandomValues(new Uint32Array(1))[0],
        title: event.location.name,
        description: event.location.name || '',
        lat: event.location.lat,
        lon: event.location.lon,
        type: 'weather-forecast',
        time: new Date(event.forecast.current.time),
        origin: 'NASA EONET',
        originIconId: 'natureEvents',
        link: 'https://open-meteo.com/'
      } as CommonEventInterface;
    }

  ngOnDestroy(): void {
    this.userCoordsSubscription?.unsubscribe();
    this.userLocationSubscription?.unsubscribe();
  }
  
}
