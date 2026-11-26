import { Component, EventEmitter, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { interval, Observable, Subscription } from 'rxjs';
import { NominatimResponse, OpenStreetmapService } from '../../../../services/open-streetmap-service';
import { OpenMeteoService, WeatherResponse } from '../../../../services/open-meteo-service';
import { WEATHER_ICONS } from '../../../../model/common/interfaces/weather-icon.interface';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NgbTooltip],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements OnInit, OnDestroy {

  @Output()
  onGoToCoords = new EventEmitter<{lat: number, lng: number}>();
  
  userCoords = signal<{ latitude: number; longitude: number } | null>(null);
  userLocation?: NominatimResponse;
  userLocationSubscription?: Subscription;

  locationForecast?: WeatherResponse;
  locationForecastSubscription?: Subscription;
  locationForecastIntervalSubscription?: Subscription;

  constructor(
    private readonly openStreetmapService: OpenStreetmapService,
    private readonly openMeteoService: OpenMeteoService
  ) {}

  getUserCoords(): Observable<{latitude: number, longitude: number} | undefined> {
    return new Observable<{latitude: number, longitude: number} | undefined>((observer) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {

          this.userCoords.set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });

          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          observer.complete();
          
        },
        (error) => {
          console.error(error.message);

          observer.next(undefined);
          observer.complete();
        }
      );
    });
  }

  goToUserCoords() {
    const lat = this.userCoords()?.latitude;
    const lng = this.userCoords()?.longitude;
    if (lat && lng) {
      this.onGoToCoords.emit({lat, lng});
    }
  }

  loadForecast(lat: number, lng: number) {
    // Load forecast
    this.locationForecastSubscription = this.openMeteoService.getForecast(lat, lng).subscribe({
      next: (_res) => {
        this.locationForecast = _res;
      }, 
      error: (_err) => {
        console.log('Error retrieving forecast', _err);
      }
    });
  }

  getWeatherIcon(code: number, isDay: number): string {
    const weather = WEATHER_ICONS[code];
    if (!weather) {
      return '❓';
    }
    return isDay ? weather.day : weather.night;
  }

  getWeatherDescription(code: number): string {
    return WEATHER_ICONS[code]?.description ?? 'Unknown';
  }

  ngOnInit(): void {
    this.getUserCoords().subscribe({
      next: (_coords) => {
        if (_coords) {
          // Load location
          this.userLocationSubscription = this.openStreetmapService.getAddress(_coords.latitude, _coords.longitude).subscribe({
            next: (_res) => {
              this.userLocation = _res;
            }, 
            error: (_err) => {
              console.log('Error retrieving location', _err);
            }
          });

          this.loadForecast(_coords.latitude, _coords.longitude);
          // Refresh every 30 minutes
          this.locationForecastIntervalSubscription = interval(1 * 60 * 1000)
          .subscribe(() => {
            this.loadForecast(_coords.latitude, _coords.longitude);
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.userLocationSubscription?.unsubscribe();
    this.locationForecastSubscription?.unsubscribe();
    this.locationForecastIntervalSubscription?.unsubscribe();
  }

}
