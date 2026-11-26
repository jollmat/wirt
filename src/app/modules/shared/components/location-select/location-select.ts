
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  OnDestroy,
  OnInit
} from '@angular/core';

import { NgSelectModule } from '@ng-select/ng-select';

import {
  Subject,
  of
} from 'rxjs';

import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  finalize
} from 'rxjs/operators';
import { OpenStreetmapService, OSMLocation } from '../../../../services/open-streetmap-service';

@Component({
  selector: 'app-location-select',
  standalone: true,
  imports: [NgSelectModule],
  templateUrl: './location-select.html',
  styleUrl: './location-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationSelect implements OnInit, OnDestroy {

  @Output()
  locationSelected = new EventEmitter<OSMLocation>();

  locations: OSMLocation[] = [];

  loading = false;

  searchInput$ = new Subject<string>();

  private destroy$ = new Subject<void>();

  constructor(
    private openStreetmapService: OpenStreetmapService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchInput$
    .pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        if (!searchTerm || searchTerm.trim().length < 3) {
          this.locations = [];
          this.cdr.markForCheck();
          return of([]);
        }

        this.loading = true;
        this.cdr.markForCheck();

        return this.openStreetmapService
          .searchLocation(searchTerm.trim())
          .pipe(
            catchError(() => of([])),
            finalize(() => {
              this.loading = false;
            })
          );
      })
    ).subscribe(locations => {
      this.locations = locations;
      this.cdr.detectChanges();
    });
  }

  onLocationSelected(location: OSMLocation | null): void {
    if (location) {
      this.locationSelected.emit(location);
    }

    setTimeout(() => {
      // Reset search results
      this.locations = [];

      // Reset search input
      this.searchInput$.next('');

      this.cdr.markForCheck();
    }, 1000);
    
  }

  trackByFn(location: OSMLocation): number {
    return location.place_id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchInput$.complete();
  }
}
