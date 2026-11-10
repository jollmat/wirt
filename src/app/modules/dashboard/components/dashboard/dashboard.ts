import { Component, DestroyRef, effect, HostListener, inject, OnDestroy, OnInit, SecurityContext, signal } from '@angular/core';
import { Header } from '../../../shared/components/header/header';
import { EarthquakeUsgsService } from '../../../../services/earthquake-usgs-service';
import { EarthquakeFeatureUsgsInterface } from '../../../../model/earthquake-usgs/interfaces/earthquake-feature-usgs.interface';
import { DatePipe, DecimalPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { interval, Observable, of, startWith, Subscription } from 'rxjs';
import { NasaEonetEventInterface } from '../../../../model/nasa-eonet/interfaces/nasa-eonet-event.interface';
import { NasaEonetService } from '../../../../services/nasa-eonet-service';
import { LeafletMap, MapLocation } from '../../../shared/components/leaflet-map/leaflet-map';
import { DateRangeConverted } from '../../../shared/components/date-range-picker/date-range-picker';
import { AlertsLiveService } from '../../../../services/alerts-live-service';
import { AlertsLiveEventInterface } from '../../../../model/alerts-live/alerts-live-event.interface';
import { CityAlertLiveService } from '../../../../services/city-alert-live-service';
import { CityAlertIncidentInterface } from '../../../../model/city-alert/city-alert-incident.interface';
import { CommonEventInterface } from '../../../../model/common/interfaces/common-event.interface';
import { DomSanitizer } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WhoDiseaseNewsService } from '../../../../services/who-disease-news-service';
import { WhoDiseaseNewsInterface } from '../../../../model/who-disease-news/interfaces/who-disease-news.interface';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SeismicPortalEvent, SeismicPortalService } from '../../../../services/seismic-portal-service';
import moment from 'moment';
import { Platform } from '@angular/cdk/platform';
import { EarthquakePerception } from '../../../../services/seismic-metrics-service';
import { GNewsArticle, GNewsService } from '../../../../services/gnews-service';
import { DeviceDirective } from '../../../shared/directives/device-directive';
import { LeafletMapService } from '../../../../services/leaflet-map-service';

export const WidgetWidthClasses = [
  'w-50',
  'w-100',
] as const;

export type WidgetWidthClassType = typeof WidgetWidthClasses[number];
export interface WidgetDisplayConfig { display: boolean; widthClass: string; collapsed: boolean;};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Header, DatePipe, DecimalPipe, NgClass, LeafletMap, FormsModule, NgSelectModule, NgbTooltip, NgTemplateOutlet, DeviceDirective],
  providers: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {

  private datePipe = inject(DatePipe);

  private refreshSubscription?: Subscription;

  viewType = signal('GRID');
  dateFrom!: Date;
  dateTo!: Date;

  currentTime = signal(Date.now());

  private leafletMapsService = inject(LeafletMapService);
  private earthquakeUsgsService = inject(EarthquakeUsgsService);
  private nasaEonetService = inject(NasaEonetService);
  private alertsLiveService = inject(AlertsLiveService);
  private cityAlertLiveService = inject(CityAlertLiveService);
  private whoDiseaseNewsService = inject(WhoDiseaseNewsService);
  private seismicService = inject(SeismicPortalService);
  private gNewsService = inject(GNewsService);
  
  userCoordsSubscription?: Subscription;
  earthQuakeUsgsSubscription?: Subscription;
  nasaEonetSubscription?: Subscription;
  alertsLiveSubscription?: Subscription;
  cityAlertLiveSubscription?: Subscription;
  whoDiseaseNewsSubscription?: Subscription;
  seismicPortalSocketSubscription?: Subscription;
  seismicPortalStoredEventsSubscription?: Subscription;
  gNewsServiceSubscription?: Subscription;
  
  earthQuakes: EarthquakeFeatureUsgsInterface[] = [];
  natureEvents: NasaEonetEventInterface[] = [];
  alertsLiveEvents: AlertsLiveEventInterface[] = [];
  alertsLiveTypes: string[] = [];
  cityAlertLiveIncidents: CityAlertIncidentInterface[] = [];
  cityAlertLiveCategories: string[] = [];
  whoDiseaseNews: WhoDiseaseNewsInterface[] = [];
  seismicPortalEearthquakes: SeismicPortalEvent[] = [];
  gNews: GNewsArticle[] = [];

  nearAlerts: CommonEventInterface[] = [];
  recentAlerts: CommonEventInterface[] = [];

  earthQuakesError?: string;
  natureEventsError?: string;
  alertsLiveError?: string;
  cityAlertLiveError?: string;
  whoDiseaseNewsError?: string;
  gNewsError?: string;

  nearEventsSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  recentEventsSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  earthQuakesSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  natureEventsSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  alertsLiveSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  cityAlertSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  whoDiseaseNewsSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  seismicPortalEearthquakesSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};
  gNewsSortConfig: {field: string, dir: 'ASC' | 'DESC'} = {field:'time', dir:'DESC'};

  /* Map & Widgets display config */
  displayConfig: {
    widget: {
      nearEvents: WidgetDisplayConfig,
      recentEvents: WidgetDisplayConfig,
      earthQuakes: WidgetDisplayConfig,
      natureEvents: WidgetDisplayConfig,
      alertsLive: WidgetDisplayConfig,
      cityAlertLiveIncidents: WidgetDisplayConfig,
      seismicPortalEvents: WidgetDisplayConfig,
      whoDiseaseNews: WidgetDisplayConfig,
      gNews: WidgetDisplayConfig,

      alertsLiveType: string,
      cityAlertLiveCategory: string
    },
    map: {
      earhQuakes: boolean,
      natureEvents: boolean,
      alertsLive: boolean,
      cityAlertLiveIncidents: boolean,
      seismicPortalEvents: boolean
    }
  } = {
    widget: {
      nearEvents: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      recentEvents: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      earthQuakes: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      natureEvents: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      alertsLive: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      alertsLiveType: 'all',
      cityAlertLiveIncidents: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      cityAlertLiveCategory: 'all',
      seismicPortalEvents: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      whoDiseaseNews: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      },
      gNews: {
        display: true,
        widthClass: 'w-50',
        collapsed: false
      }
    },
    map: {
      earhQuakes: false,
      natureEvents: false,
      alertsLive: false,
      cityAlertLiveIncidents: false,
      seismicPortalEvents: true
    }
  };
  locations: MapLocation[] = [];

  maximizedWidgetId?: string;

  typesIcons: {type: string, icon: string}[] = [
    {type: 'gathering', icon: 'fa-people-group'},
    {type: 'clashes', icon: 'fa-hand-fist'},
    {type: 'shooting', icon: 'fa-gun'},
    {type: 'assault', icon: 'fa-person-rifle'},
    {type: 'closure', icon: 'fa-road-barrier'},

    {type: 'crime', icon: 'fa-skull'},
    {type: 'violent crime', icon: 'fa-gun'},
    {type: 'disaster', icon: 'fa-burst'},
    {type: 'fire', icon: 'fa-fire'},
    {type: 'health', icon: 'fa-house-medical'},
    {type: 'infra', icon: 'fa-warning'},
    {type: 'report', icon: 'fa-newspaper'},
    {type: 'unrest', icon: 'fa-explosion'},
    {type: 'weather', icon: 'fa-cloud-showers-water'},
    {type: 'Weather events', icon: 'fa-cloud-showers-water'},
    {type: 'demonstration', icon: 'fa-binoculars'},
    {type: 'piracy', icon: 'fa-skull-crossbones'},
    {type: 'armed clash', icon: 'fa-person-rifle'},
    {type: 'fighting', icon: 'fa-hand-fist'},
    {type: 'vessel attack', icon: 'fa-ship'},
    {type: 'earthquake', icon: 'fa-house-chimney-crack'},
    {type: 'emergencia', icon: 'fa-truck-medical'},
    {type: 'urgence', icon: 'fa-truck-medical'},
    {type: 'emergenza', icon: 'fa-truck-medical'},
    {type: 'emergència', icon: 'fa-truck-medical'},
    {type: 'emergency', icon: 'fa-truck-medical'},
    {type: 'coastal flood advisory', icon: 'fa-house-flood-water'},
    {type: 'flash flood warning', icon: 'fa-house-flood-water'},
    {type: 'flood advisory', icon: 'fa-house-flood-water'},
    {type: 'flood warning', icon: 'fa-house-flood-water'},
    {type: 'flood watch', icon: 'fa-house-flood-water'},
    {type: 'volcanic bulletin', icon: 'fa-volcano'},
    {type: 'volcano aviation notice', icon: 'fa-volcano'},
    {type: 'tropical cyclone', icon: 'fa-volcano'},
    {type: 'volcano unrest', icon: 'fa-volcano'},
    {type: 'tropical cyclone', icon: 'fa-hurricane'},
    {type: 'advice / health', icon: 'fa-comment-medical'},
    {type: 'rescue / rescue road trap', icon: 'fa-life-ring'},
    {type: 'smoke alert', icon: 'fa-smog'},
    {type: 'delito', icon: 'fa-skull'},
    {type: 'collision', icon: 'fa-burst'},
    {type: 'crash', icon: 'fa-burst'},
    {type: 'colisión', icon: 'fa-burst'},
    {type: 'load shedding', icon: 'fa-plug-circle-minus'},
    {type: 'accident', icon: 'fa-triangle-exclamation'},
    {type: 'road condition', icon: 'fa-person-digging'},
    {type: 'roadwork', icon: 'fa-person-digging'},
    {type: 'closure', icon: 'fa-road-barrier'},
    {type: 'closed roads', icon: 'fa-road-barrier'},
    {type: 'power outage', icon: 'fa-plug-circle-minus'},
    {type: 'ground stop', icon: 'fa-hand'},
    {type: 'road work', icon: 'fa-person-digging'},
    {type: 'construction', icon: 'fa-person-digging'},
    {type: 'trafikk', icon: 'fa-traffic-light'},
    {type: 'airport closure', icon: 'fa-plane-lock'},
    {type: 'waze incidents', icon: 'fa-biohazard'},
    {type: 'waze incident', icon: 'fa-biohazard'},
    {type: 'waze_accident', icon: 'fa-biohazard'},
    {type: 'border wait time', icon: 'fa-hourglass'},
    {type: 'active roadwork', icon: 'fa-person-digging'},
    {type: 'missing person', icon: 'fa-person-circle-exclamation'},
    {type: 'persona desapareguda', icon: 'fa-person-circle-exclamation'},
    {type: 'personne disparue', icon: 'fa-person-circle-exclamation'},
    {type: 'pessoa desaparecida', icon: 'fa-person-circle-exclamation'},
    {type: 'persona desaparecida', icon: 'fa-person-circle-exclamation'},
    {type: 'sigmet thunderstorms', icon: 'fa-cloud-bolt'},
    {type: 'heatwave warning', icon: 'fa-temperature-arrow-up'},
    {type: 'strong winds and rough seas warning', icon: 'fa-wind'},
    {type: 'moderate rain', icon: 'fa-cloud-rain'},
    {type: 'gale warning', icon: 'fa-cloud-showers-water'},
    {type: 'weather warning', icon: 'fa-warning'},
    {type: 'wind advisory', icon: 'fa-wind'},
    {type: 'winter weather advisory', icon: 'fa-snowflake'},
    {type: 'high wind watch', icon: 'fa-wind'},
    {type: 'severe wind report', icon: 'fa-wind'},
    {type: 'fog', icon: 'fa-smog'},
    {type: 'lluvias', icon: 'fa-cloud-rain'},
    {type: 'temperaturas máximas', icon: 'fa-temperature-arrow-up'},
    {type: 'deshielos', icon: 'fa-icicles'},
    {type: 'costeros', icon: 'fa-warning'},
    {type: 'seism-portal', icon: 'fa-house-chimney-crack'},
    {type: 'crimine', icon:'fa-gavel'}
  ];
  mapSelectorMaximized = signal(false);

  userCoords = signal<{ latitude: number; longitude: number } | null>(null);
  userNearKm = 50;
  nearKmOptions = [5,10,50,100,250,500,1000,2500,5000];

  withinTimeOptions: {text: string, value: number}[] = [
    {text: '10 min', value: 0.1667},
    {text: '15 min', value: 0.25},
    {text: '30 min', value: 0.5},
    {text: '1 hour', value: 1}
  ]
  withinTimeHours = this.withinTimeOptions[0].value;

  widgetWidthClasses = [...WidgetWidthClasses];

  deviceInfo: {
    isTablet: boolean,
    isMobile: boolean,
    isDesktop: boolean,
    landscape: boolean,
    portrait: boolean
  } = {
    isTablet: false,
    isMobile: false,
    isDesktop: true,
    landscape: true,
    portrait: false
  };

  constructor(
    private sanitizer: DomSanitizer
  ) {

    this.detectDevice();

    const destroyRef = inject(DestroyRef);
    interval(60 * 1000).pipe(
      startWith(0),
      takeUntilDestroyed(destroyRef)
    ).subscribe(() => {
      this.currentTime.set(Date.now());
    });

    effect(() => {
      const coords = this.userCoords();
      if (coords) {
        //console.log('Coordinates changed:', coords);
      }
    });
  }

  @HostListener('window:resize')
  @HostListener('window:orientationchange')
  detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width <= 767) {
      this.deviceInfo = {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        landscape: width > height,
        portrait: height > width
      };
    } else if (width <= 1366) {
      this.deviceInfo = {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        landscape: width > height,
        portrait: height > width
      };
    } else {
      this.deviceInfo = {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        landscape: width > height,
        portrait: height > width
      };
    }
    console.log(this.deviceInfo);
  }

  udateWidgetWidth(widgetId: string, widgetDisplayConf: WidgetDisplayConfig, widthClass: WidgetWidthClassType) {
    widgetDisplayConf.widthClass = widthClass;
    switch(widgetId) {
      case 'nearEvents':
        this.displayConfig.widget.nearEvents = widgetDisplayConf;
        break;
      case 'recentEvents':
        this.displayConfig.widget.recentEvents = widgetDisplayConf;
        break;
      case 'usgsEarthquakes':
        this.displayConfig.widget.earthQuakes = widgetDisplayConf;
        break;
      case 'seismicPortal':
        this.displayConfig.widget.seismicPortalEvents = widgetDisplayConf;
        break;
      case 'alertsLive':
        this.displayConfig.widget.alertsLive = widgetDisplayConf;
        break;
      case 'cityAlert':
        this.displayConfig.widget.cityAlertLiveIncidents = widgetDisplayConf;
        break;
      case 'naturalEvents':
        this.displayConfig.widget.natureEvents = widgetDisplayConf;
        break;
      case 'whoDisease':
        this.displayConfig.widget.whoDiseaseNews = widgetDisplayConf;
        break;
      case 'gNews':
        this.displayConfig.widget.gNews = widgetDisplayConf;
        break;
    }
  }

  sanitizeHtml(html: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }

  sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return '';
      }

      return parsedUrl.href;
    } catch {
      return '';
    }
  }

  getSeismicPortalEventIconColor(earthquakePerception?: EarthquakePerception): string {
    let res = '#b1afaf';
    if (earthquakePerception?.level) {
      switch(earthquakePerception.level) {
        case 'very-weak':
        case 'weak':
          res = 'rgb(172, 248, 157)';
          break;
        case 'light':
        case 'moderate':
          res = 'rgb(228, 203, 59)';
          break;
        case 'strong':
        case 'very-strong':
          res = '#dc0028';
          break;
      }
    }
    return res;
  }

  getFaIconByTypeOrCategory(type: string, category?: string): string {
    let iconClass = this.typesIcons.find((_typeIcon) => _typeIcon.type.toLowerCase()===type.toLowerCase())?.icon;
    if (!iconClass && category) {
      iconClass = this.typesIcons.find((_typeIcon) => _typeIcon.type.toLowerCase()===category.toLowerCase())?.icon;
    }
    return iconClass || 'fa-exclamation-circle';
  }

  setViewType(vType: 'MAP' | 'GRID') {
    this.viewType.set(vType);
  }

  getFormattedDate(d: Date, strFormat = 'YYYY-MM-DD'): string {
    return moment(d).format(strFormat);
  }

  getItemDisplayConfig(source: string, type: string, category?: string, iconColor?: string): {icon: string, iconTag: string, color: string} {
    let color = iconColor || '';
    let icon = '';
    switch (source) {
      case 'earthQuakes':
        icon = 'fa-house-chimney-crack';
        color = iconColor || '#dca900';
        break;
      case 'natureEvents':
        icon = 'fa-cloud-bolt';
        color = iconColor || '#001adc';
        break;
      case 'alertsLive':
        icon = this.getFaIconByTypeOrCategory(type);
        color = iconColor || '#dc0b00';
        break;
      case 'cityAlert':
        icon = this.getFaIconByTypeOrCategory(type, category);
        color = iconColor || '#dc0b00';
        break;
      case 'seismPortal':
        icon = this.getFaIconByTypeOrCategory('seism-portal');
        color = iconColor || '#dc0b00';
        break;
    }
    return {
      icon,
      iconTag: `<span class="icon-wrapper p-1" style="box-shadow: 0 2px 6px rgba(0, 0, 0, .35);border-radius:25px; background-color:${color} !important;color:#fff !important;"><i class="fas ${icon}"></i></span>`,
      color
    };
  }

  getHighestDate(
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

  getEventDate(ev: NasaEonetEventInterface, formatStr?: string): string {
    if (this.getFormattedDate(this.dateFrom)===this.getFormattedDate(this.dateTo)) {
      return this.getFormattedDate(this.dateFrom, formatStr);
    }
    const highestDate = this.getHighestDate(ev.geometry, this.dateFrom, this.dateTo);
    return (highestDate!=null) ? this.getFormattedDate(highestDate, formatStr) : '';
  }

  isToday(date: Date | string | null): boolean {
    if (!date) {
      return true;
    }
    const inputDate = new Date(date);
    const today = new Date();

    return (
      inputDate.getDate() === today.getDate() &&
      inputDate.getMonth() === today.getMonth() &&
      inputDate.getFullYear() === today.getFullYear()
    );
  }

  isWithinTime(date: string | Date, hours = this.withinTimeHours): boolean {
    const eventTime = new Date(date).getTime();
    const now = Date.now();

    const difference = now - eventTime;

    return difference >= 0 && difference < hours * 60 * 60 * 1000;
  }

  onDateRangeChange(event: DateRangeConverted): void {
    event.from.setHours(0);
    event.from.setMinutes(0);
    event.from.setSeconds(0);
    event.to.setHours(23);
    event.to.setMinutes(59);
    event.to.setSeconds(59);
    this.dateFrom = event.from;
    this.dateTo = event.to;
    this.requestData();   
  }

  requestData() {
    this.nearAlerts = [];
    this.earthQuakesError = undefined;
    this.natureEventsError = undefined;
    this.alertsLiveError = undefined;
    this.cityAlertLiveError = undefined;
    
    this.earthQuakeUsgsSubscription = this.earthquakeUsgsService.getEarthQuakes(this.dateFrom, this.dateTo).subscribe({
      next: (_earthquakesLast24h) => {
        this.earthQuakes = _earthquakesLast24h.sort((a,b) => a.properties.time>b.properties.time? -1 : 1);
      },
      error: (_error) => {
        this.earthQuakesError = _error.error.error;
      }
    });

    this.nasaEonetSubscription = this.nasaEonetService.getNaturalEvents(this.dateFrom, this.dateTo).subscribe({
      next: (_naturtalEvents) => {
        this.natureEvents = _naturtalEvents.sort((a,b) => {
          const aHiguestDate = this.getHighestDate(a.geometry, this.dateFrom, this.dateTo);
          const bHiguestDate = this.getHighestDate(b.geometry, this.dateFrom, this.dateTo);
          return (aHiguestDate && bHiguestDate && aHiguestDate.getTime()>bHiguestDate.getTime()) ? -1 : 1;
        });
      },
      error: (_error) => {
        this.natureEventsError = _error.error.error;
      }
    });

    this.alertsLiveSubscription = this.alertsLiveService.getAlertsLiveEvents(this.dateFrom, this.dateTo).subscribe({
      next: (_alertsLiveEvents) => {
        // Categories filter
        function getUniqueTypes(
          events: AlertsLiveEventInterface[]
        ): string[] {
          return [...new Set(events.map(event => event.type))].sort((a,b) => a>b?1:-1);
        }
        this.alertsLiveTypes = getUniqueTypes(_alertsLiveEvents);
        this.alertsLiveTypes.unshift('all');
        this.alertsLiveEvents = _alertsLiveEvents.sort((a,b) => a.last_seen>b.last_seen? -1 : 1);
      },
      error: (_error) => {
        this.alertsLiveError = _error.error.error;
      }
    });

    this.cityAlertLiveSubscription = this.cityAlertLiveService.getCityAlertIncidents(this.dateFrom, this.dateTo).subscribe({
      next: (_cityAlertLiveIncidents) => {
        function getUniqueCategories(
          incidents: CityAlertIncidentInterface[]
        ): string[] {
          return [...new Set(incidents.map(incident => incident.category))].sort((a,b) => a>b?1:-1);
        }
        this.cityAlertLiveCategories = getUniqueCategories(_cityAlertLiveIncidents);
        this.cityAlertLiveCategories.unshift('all');
        this.cityAlertLiveIncidents = _cityAlertLiveIncidents.sort((a,b) => a.time>b.time? -1 : 1);
      },
      error: (_error) => {
        this.cityAlertLiveError = _error.error.error;
      }
    });

    this.whoDiseaseNewsSubscription = this.whoDiseaseNewsService.getWhoDiseaseNews(this.dateFrom, this.dateTo).subscribe({
      next: (_whoDiseaseNews) => {
        this.whoDiseaseNews = _whoDiseaseNews;
      }, 
      error: (_error) => {
        this.whoDiseaseNewsError = _error.error.error;
      }
    });

    this.seismicPortalStoredEventsSubscription = this.seismicService.getStoredEvents().subscribe({
      next: (_seismicPortalEvents) => {
        this.seismicPortalEearthquakes = _seismicPortalEvents;
      }
    });

    this.gNewsServiceSubscription = this.gNewsService.obtenerNoticias().subscribe({
      next: (_gNews) => {
        this.gNews = _gNews.articles;
      }, 
      error: (_error) => {
        this.gNewsError = _error.error.error;
      }
    });
    
  }

  toggleSort(sortConfig: {field: string, dir: 'ASC' | 'DESC'}, field: string) {
    if (sortConfig.field===field) {
      sortConfig.dir = sortConfig.dir==='ASC' ? 'DESC' : 'ASC';
    }
    sortConfig.field = field;
  }

  get filteredNearEvents(): CommonEventInterface[] {
    const sortConfig = this.nearEventsSortConfig;
    const res: CommonEventInterface[] = [];
    this.filteredEarthquakes.forEach((_event) => {
      const commonEvent = EarthquakeUsgsService.toCommonEvent(_event);
      if (this.isWithinRadius(commonEvent.lat, commonEvent.lon)) {
        res.push(commonEvent);
      }
    });
    this.filteredNatureEvents.forEach((_event) => {
      const commonEvent = NasaEonetService.toCommonEvent(_event, this.dateFrom, this.dateTo);
      if (this.isWithinRadius(commonEvent.lat, commonEvent.lon)) {
        res.push(commonEvent);
      }
    });
    this.filteredAlertsLiveEvents.forEach((_event) => {
      const commonEvent = AlertsLiveService.toCommonEvent(_event);
      if (this.isWithinRadius(commonEvent.lat, commonEvent.lon)) {
        res.push(commonEvent);
      }
    });
    this.filteredCityAlertLiveIncidents.forEach((_event) => {
      const commonEvent = CityAlertLiveService.toCommonEvent(_event);
      if (this.isWithinRadius(commonEvent.lat, commonEvent.lon)) {
        res.push(commonEvent);
      }
    });
    this.filteredSeismicPortalEearthquakes.forEach((_event) => {
      const commonEvent = SeismicPortalService.toCommonEvent(_event);
      if (this.isWithinRadius(commonEvent.lat, commonEvent.lon)) {
        res.push(commonEvent);
      }
    });
    
    return res.sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.time > b.time ? -1 : 1;
        } else {
          append = a.time > b.time ? 1 : -1;
        }
      }
      if (sortConfig.field==='type') {
        if (sortConfig.dir==='DESC') {
          append = a.type > b.type ? -1 : 1;
        } else {
          append = a.type > b.type ? 1 : -1;
        }
      }
      if (sortConfig.field==='category') {
        if (sortConfig.dir==='DESC') {
          append = (a.category || '') > (b.category || '') ? -1 : 1;
        } else {
          append = (a.category || '') > (b.category || '') ? 1 : -1;
        }
      }
      if (sortConfig.field==='origin') {
        if (sortConfig.dir==='DESC') {
          append = a.origin > b.origin ? -1 : 1;
        } else {
          append = a.origin > b.origin ? 1 : -1;
        }
      }
      if (sortConfig.field==='title') {
        if (sortConfig.dir==='DESC') {
          append = a.title > b.title ? -1 : 1;
        } else {
          append = a.title > b.title ? 1 : -1;
        }
      }
      if (sortConfig.field==='description') {
        if (sortConfig.dir==='DESC') {
          append = a.description > b.description ? -1 : 1;
        } else {
          append = a.description > b.description ? 1 : -1;
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredRecentEvents(): CommonEventInterface[] {
    const sortConfig = this.recentEventsSortConfig;
    const res: CommonEventInterface[] = [];
    this.filteredEarthquakes.forEach((_event) => {
      const commonEvent = EarthquakeUsgsService.toCommonEvent(_event);
      if (this.isWithinTime(commonEvent.time, this.withinTimeHours)) {
        res.push(commonEvent);
      }
    });
    this.filteredNatureEvents.forEach((_event) => {
      const commonEvent = NasaEonetService.toCommonEvent(_event, this.dateFrom, this.dateTo);
      if (this.isWithinTime(commonEvent.time, this.withinTimeHours)) {
        res.push(commonEvent);
      }
    });
    this.filteredAlertsLiveEvents.forEach((_event) => {
      const commonEvent = AlertsLiveService.toCommonEvent(_event);
      if (this.isWithinTime(commonEvent.time, this.withinTimeHours)) {
        res.push(commonEvent);
      }
    });
    this.filteredCityAlertLiveIncidents.forEach((_event) => {
      const commonEvent = CityAlertLiveService.toCommonEvent(_event);
      if (this.isWithinTime(commonEvent.time, this.withinTimeHours)) {
        res.push(commonEvent);
      }
    });
    this.filteredSeismicPortalEearthquakes.forEach((_event) => {
      const commonEvent = SeismicPortalService.toCommonEvent(_event);
      if (this.isWithinTime(commonEvent.time, this.withinTimeHours)) {
        res.push(commonEvent);
      }
    });
    
    return res.sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.time > b.time ? -1 : 1;
        } else {
          append = a.time > b.time ? 1 : -1;
        }
      }
      if (sortConfig.field==='type') {
        if (sortConfig.dir==='DESC') {
          append = a.type > b.type ? -1 : 1;
        } else {
          append = a.type > b.type ? 1 : -1;
        }
      }
      if (sortConfig.field==='category') {
        if (sortConfig.dir==='DESC') {
          append = (a.category || '') > (b.category || '') ? -1 : 1;
        } else {
          append = (a.category || '') > (b.category || '') ? 1 : -1;
        }
      }
      if (sortConfig.field==='origin') {
        if (sortConfig.dir==='DESC') {
          append = a.origin > b.origin ? -1 : 1;
        } else {
          append = a.origin > b.origin ? 1 : -1;
        }
      }
      if (sortConfig.field==='title') {
        if (sortConfig.dir==='DESC') {
          append = a.title > b.title ? -1 : 1;
        } else {
          append = a.title > b.title ? 1 : -1;
        }
      }
      if (sortConfig.field==='description') {
        if (sortConfig.dir==='DESC') {
          append = a.description > b.description ? -1 : 1;
        } else {
          append = a.description > b.description ? 1 : -1;
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredEarthquakes(): EarthquakeFeatureUsgsInterface[] {
    const sortConfig = this.earthQuakesSortConfig;
    this.earthQuakes.sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.properties.time > b.properties.time ? -1 : 1;
        } else {
          append = a.properties.time > b.properties.time ? 1 : -1;
        }
      }
      if (sortConfig.field==='depth') {
        if (sortConfig.dir==='DESC') {
          append = a.geometry.coordinates[2] > b.geometry.coordinates[2] ? -1 : 1;
        } else {
          append = a.geometry.coordinates[2] > b.geometry.coordinates[2] ? 1 : -1;
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.geometry.coordinates[1], a.geometry.coordinates[0]) > this.getDistanceKm(b.geometry.coordinates[1], b.geometry.coordinates[0]) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.geometry.coordinates[1], a.geometry.coordinates[0]) > this.getDistanceKm(b.geometry.coordinates[1], b.geometry.coordinates[0]) ? 1 : -1;
        }
      }
      if (sortConfig.field==='mag') {
        if (sortConfig.dir==='DESC') {
          append = a.properties.mag > b.properties.mag ? -1 : 1;
        } else {
          append = a.properties.mag > b.properties.mag ? 1 : -1;
        }
      }
      if (sortConfig.field==='perception') {
        if (sortConfig.dir==='DESC') {
          append = (a.properties.perception?.level || '') > (b.properties.perception?.level || '') ? -1 : 1;
        } else {
          append = (a.properties.perception?.level || '') > (b.properties.perception?.level || '') ? 1 : -1;
        }
      }
      return append;
    });
    return this.earthQuakes;
  }

  get filteredNatureEvents(): NasaEonetEventInterface[] {
    const sortConfig = this.natureEventsSortConfig;
    return this.natureEvents.sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        const aTime = this.getHighestDate(a.geometry, this.dateFrom, this.dateTo);
        const bTime = this.getHighestDate(b.geometry, this.dateFrom, this.dateTo);
        if (aTime && bTime) {
          if (sortConfig.dir==='DESC') {
            append = aTime?.getTime() > bTime?.getTime() ? -1 : 1;
          } else {
            append = aTime?.getTime() > bTime?.getTime() ? 1 : -1;
          }
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.geometry[0].coordinates[1], a.geometry[0].coordinates[0]) > this.getDistanceKm(b.geometry[0].coordinates[1], b.geometry[0].coordinates[0]) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.geometry[0].coordinates[1], a.geometry[0].coordinates[0]) > this.getDistanceKm(b.geometry[0].coordinates[1], b.geometry[0].coordinates[0]) ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredAlertsLiveEvents(): AlertsLiveEventInterface[] {
    const sortConfig = this.alertsLiveSortConfig;
    let res : AlertsLiveEventInterface[] = this.alertsLiveEvents;
    if (this.displayConfig.widget.alertsLiveType!=='all') {
      res = this.displayConfig.widget.alertsLiveType
        ? this.alertsLiveEvents.filter(i => i.type === this.displayConfig.widget.alertsLiveType)
        : this.alertsLiveEvents;
    }
    return res.sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.first_seen > b.first_seen ? -1 : 1;
        } else {
          append = a.first_seen > b.first_seen ? 1 : -1;
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? 1 : -1;
        }
      }
      if (sortConfig.field==='type') {
        if (sortConfig.dir==='DESC') {
          append = a.type > b.type ? -1 : 1;
        } else {
          append = a.type > b.type ? 1 : -1;
        }
      }
       if (sortConfig.field==='title') {
        if (sortConfig.dir==='DESC') {
          append = a.title > b.title ? -1 : 1;
        } else {
          append = a.title > b.title ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredCityAlertLiveIncidents(): CityAlertIncidentInterface[] {
    const sortConfig = this.cityAlertSortConfig;
    let res : CityAlertIncidentInterface[] = this.cityAlertLiveIncidents;
    if (this.displayConfig.widget.cityAlertLiveCategory!=='all') {
      res = this.displayConfig.widget.cityAlertLiveCategory
        ? this.cityAlertLiveIncidents.filter(i => i.category === this.displayConfig.widget.cityAlertLiveCategory)
        : this.cityAlertLiveIncidents;
    }
    return res.sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.time > b.time ? -1 : 1;
        } else {
          append = a.time > b.time ? 1 : -1;
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.lat, a.lon) > this.getDistanceKm(b.lat, b.lon) ? 1 : -1;
        }
      }
      if (sortConfig.field==='category') {
        if (sortConfig.dir==='DESC') {
          append = a.category > b.category ? -1 : 1;
        } else {
          append = a.category > b.category ? 1 : -1;
        }
      }
      if (sortConfig.field==='type') {
        if (sortConfig.dir==='DESC') {
          append = a.type > b.type ? -1 : 1;
        } else {
          append = a.type > b.type ? 1 : -1;
        }
      }
      if (sortConfig.field==='title') {
        if (sortConfig.dir==='DESC') {
          append = a.title > b.title ? -1 : 1;
        } else {
          append = a.title > b.title ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredWhoDiseaseNews(): WhoDiseaseNewsInterface[] {
    const sortConfig = this.whoDiseaseNewsSortConfig;
    let res : WhoDiseaseNewsInterface[] = this.whoDiseaseNews;
    return res.filter((_newsItem) => {
      return _newsItem.LastModified.getTime()>=this.dateFrom.getTime() && _newsItem.LastModified.getTime() <= this.dateTo.getTime();
    }).sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.LastModified > b.LastModified ? -1 : 1;
        } else {
          append = a.LastModified > b.LastModified ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredSeismicPortalEearthquakes(): SeismicPortalEvent[] {
    const sortConfig = this.seismicPortalEearthquakesSortConfig;
    let res = this.seismicPortalEearthquakes.map((_seismEvent) => {
      if (typeof _seismEvent.data.properties.lastupdate === 'string') {
        _seismEvent.data.properties.lastupdate = new Date(_seismEvent.data.properties.lastupdate);
      }
      return _seismEvent;
    });
    return res.filter((_event) => {
      return _event.data.properties.lastupdate.getTime()>=this.dateFrom.getTime() && _event.data.properties.lastupdate.getTime() <= this.dateTo.getTime();
    }).sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.data.properties.lastupdate > b.data.properties.lastupdate ? -1 : 1;
        } else {
          append = a.data.properties.lastupdate > b.data.properties.lastupdate ? 1 : -1;
        }
      }
      if (sortConfig.field==='dist') {
        if (sortConfig.dir==='DESC') {
          append = this.getDistanceKm(a.data.properties.lat, a.data.properties.lon) > this.getDistanceKm(b.data.properties.lat, b.data.properties.lon) ? -1 : 1;
        } else {
          append = this.getDistanceKm(a.data.properties.lat, a.data.properties.lon) > this.getDistanceKm(b.data.properties.lat, b.data.properties.lon) ? 1 : -1;
        }
      }
      if (sortConfig.field==='place') {
        if (sortConfig.dir==='DESC') {
          append = a.data.properties.flynn_region > b.data.properties.flynn_region ? -1 : 1;
        } else {
          append = a.data.properties.flynn_region > b.data.properties.flynn_region ? 1 : -1;
        }
      }
      if (sortConfig.field==='depth') {
        if (sortConfig.dir==='DESC') {
          append = a.data.properties.depth > b.data.properties.depth ? -1 : 1;
        } else {
          append = a.data.properties.depth > b.data.properties.depth ? 1 : -1;
        }
      }
      if (sortConfig.field==='mag') {
        if (sortConfig.dir==='DESC') {
          append = a.data.properties.mag > b.data.properties.mag ? -1 : 1;
        } else {
          append = a.data.properties.mag > b.data.properties.mag ? 1 : -1;
        }
      }
      if (sortConfig.field==='perception') {
        if (sortConfig.dir==='DESC') {
          append = (a.data.properties.perception?.level || '') > (b.data.properties.perception?.level || '') ? -1 : 1;
        } else {
          append = (a.data.properties.perception?.level || '') > (b.data.properties.perception?.level || '') ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredGNews(): GNewsArticle[] {
    const sortConfig = this.gNewsSortConfig;
    return this.gNews.filter((_newsItem) => {
      _newsItem.published = new Date(_newsItem.publishedAt);
      return _newsItem.published.getTime()>=this.dateFrom.getTime() && _newsItem.published.getTime() <= this.dateTo.getTime();
    }).sort((a,b) => {
      let append = 1;
      if (sortConfig.field==='time') {
        if (sortConfig.dir==='DESC') {
          append = a.publishedAt > b.publishedAt ? -1 : 1;
        } else {
          append = a.publishedAt > b.publishedAt ? 1 : -1;
        }
      }
      if (sortConfig.field==='title') {
        if (sortConfig.dir==='DESC') {
          append = a.title > b.title ? -1 : 1;
        } else {
          append = a.title > b.title ? 1 : -1;
        }
      }
      if (sortConfig.field==='description') {
        if (sortConfig.dir==='DESC') {
          append = a.description > b.description ? -1 : 1;
        } else {
          append = a.description > b.description ? 1 : -1;
        }
      }
      if (sortConfig.field==='source') {
        if (sortConfig.dir==='DESC') {
          append = a.source.name > b.source.name ? -1 : 1;
        } else {
          append = a.source.name > b.source.name ? 1 : -1;
        }
      }
      return append;
    });
  }

  get filteredLocations(): MapLocation[] {
    this.locations = [];
    if (this.displayConfig.map.earhQuakes) {
      this.earthQuakes.forEach((_earthQuake, idx) => {
        const desc = `Magnitude: ${_earthQuake.properties.mag}<br />Depth: ${_earthQuake.geometry.coordinates[2]} Km<br />Perception: ${_earthQuake.properties.perception?.level}<br /><br /><a href="${_earthQuake.properties.url}" target="_blank">+ info</a><br /><br />Source: <a href="https://earthquake.usgs.gov/" target="_blank">Eathquake USGS</a>`;
        const color = this.getSeismicPortalEventIconColor(_earthQuake.properties.perception);
        const itemDisplayConfig = this.getItemDisplayConfig('earthQuakes', _earthQuake.properties.type, undefined, color);
        const iconTag = `${itemDisplayConfig.iconTag}<br /><br />`;
        const icon = `${itemDisplayConfig.icon} ${(this.isWithinTime(_earthQuake.properties.time, this.withinTimeHours))?'blink-smooth':''}`;
        this.locations.push({
          id: crypto.getRandomValues(
            new Uint32Array(1)
          )[0],
          name: `${iconTag}${this.datePipe.transform(_earthQuake.properties.time, 'DD/MM/yyyy - HH:mm')}<br />${_earthQuake.properties.place}`,
          latitude: _earthQuake.geometry.coordinates[1],
          longitude: _earthQuake.geometry.coordinates[0],
          description: desc || undefined,
          icon,
          color
        });
      });
    }
    if (this.displayConfig.map.seismicPortalEvents) {
      this.filteredSeismicPortalEearthquakes.forEach((_seismPortalEvent, idx) => {
        const color = this.getSeismicPortalEventIconColor(_seismPortalEvent.data.properties.perception);
        const itemDisplayConfig = this.getItemDisplayConfig('seismPortal', _seismPortalEvent.data.type, undefined, color);
        const iconTag = `${itemDisplayConfig.iconTag}<br /><br />`;
        const icon = `${itemDisplayConfig.icon} ${(this.isWithinTime(_seismPortalEvent.data.properties.lastupdate, this.withinTimeHours))?'blink-smooth':''}`;
        this.locations.push({
          id: crypto.getRandomValues(
            new Uint32Array(1)
          )[0],
          name: `${iconTag}${this.getFormattedDate(_seismPortalEvent.data.properties.lastupdate, 'DD/MM/yyyy HH:mm')}<br />${_seismPortalEvent.data.properties.flynn_region}`,
          latitude: _seismPortalEvent.data.properties.lat,
          longitude: _seismPortalEvent.data.properties.lon,
          description: `Magnitude: ${_seismPortalEvent.data.properties.mag}<br />Depth: ${_seismPortalEvent.data.properties.depth} Km<br />Perception: ${_seismPortalEvent.data.properties.perception?.level}<br /><br />Source: <a href="https://www.seismicportal.eu" target="_blank">Seismic Portal</a>`,
          icon,
          color
        });
      });
    }
    if (this.displayConfig.map.natureEvents) {
      this.natureEvents.forEach((_natureEvent, idx) => {
        const highestDate = this.getHighestDate(_natureEvent.geometry, this.dateFrom, this.dateTo);
        const itemDisplayConfig = this.getItemDisplayConfig('natureEvents', _natureEvent.description);
        const color = itemDisplayConfig.color;
        const iconTag = `${itemDisplayConfig.iconTag}<br /><br />`;
        const icon = `${itemDisplayConfig.icon} ${(highestDate && this.isWithinTime(highestDate, this.withinTimeHours))?'blink-smooth':''}`;
        this.locations.push({
          id: crypto.getRandomValues(
            new Uint32Array(1)
          )[0],
          name: `${iconTag}${(highestDate)?this.getFormattedDate(highestDate, 'DD/MM/yyyy - HH:mm'):''}<br />${_natureEvent.title}`,
          latitude: _natureEvent.geometry[0].coordinates[1],
          longitude: _natureEvent.geometry[0].coordinates[0],
          description: `${_natureEvent.categories[0].title}<br /><br /><a href="${_natureEvent.link}" target="_blank">+ info</a><br /><br />Source: <a href="https://eonet.gsfc.nasa.gov/" target="_blank">NASA EONET</a>`,
          icon,
          color
        });
      });
    }
    if (this.displayConfig.map.alertsLive) {
      this.filteredAlertsLiveEvents.forEach((_alertsLiveEvent, idx) => {
        const highestDate = _alertsLiveEvent.last_seen;
        const itemDisplayConfig = this.getItemDisplayConfig('alertsLive', _alertsLiveEvent.type);
        const color = itemDisplayConfig.color;
        const iconTag = `${itemDisplayConfig.iconTag}<br /><br />`;
        const icon = `${itemDisplayConfig.icon} ${(this.isWithinTime(highestDate, this.withinTimeHours))?'blink-smooth':''}`;
        this.locations.push({
          id: crypto.getRandomValues(
            new Uint32Array(1)
          )[0],
          name: `${iconTag}${(highestDate!=null) ? this.getFormattedDate(highestDate, 'DD/MM/yyyy HH:mm') : ''}<br />${_alertsLiveEvent.title}`,
          latitude: _alertsLiveEvent.lat,
          longitude: _alertsLiveEvent.lon,
          description: `${_alertsLiveEvent.type}<br /><br /><a href="${_alertsLiveEvent.url}" target="_blank">+ info</a><br /><br />Source: <a href="https://alerts.live/" target="_blank">Alerts Live</a>`,
          icon,
          color
        });
      });
    }
    if (this.displayConfig.map.cityAlertLiveIncidents) {
      this.filteredCityAlertLiveIncidents.forEach((_cityAlertLiveIncident, idx) => {
        const highestDate = _cityAlertLiveIncident.time;
        const itemDisplayConfig = this.getItemDisplayConfig('cityAlert', _cityAlertLiveIncident.type, _cityAlertLiveIncident.category);
        const color = itemDisplayConfig.color;
        const iconTag = `${itemDisplayConfig.iconTag}<br /><br />`;
        const icon = `${itemDisplayConfig.icon} ${(this.isWithinTime( _cityAlertLiveIncident.time, this.withinTimeHours))?'blink-smooth':''}`;
        this.locations.push({
          id: crypto.getRandomValues(
            new Uint32Array(1)
          )[0],
          name: `${iconTag}${(highestDate!=null) ? this.getFormattedDate(highestDate, 'DD/MM/yyyy HH:mm') : ''}<br />${_cityAlertLiveIncident.title}`,
          latitude: _cityAlertLiveIncident.lat,
          longitude: _cityAlertLiveIncident.lon,
          description: `${_cityAlertLiveIncident.type}<br /><br /><a href="${_cityAlertLiveIncident.url}" target="_blank">+ info</a><br /><br />Source: <a href="https://cityalert.live/" target="_blank">City Alert Live</a>`,
          icon,
          color
        });
      });
    }
    return this.locations;
  }

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

  getDistanceKm(latitude: number,
    longitude: number): number {
      const userCoords = this.userCoords();

      if (!userCoords) {
        return -1;
      }

      const toRadians = (degrees: number) => degrees * Math.PI / 180;

      const earthRadiusKm = 6371;

      const lat1 = toRadians(userCoords.latitude);
      const lat2 = toRadians(latitude);

      const deltaLat = toRadians(latitude - userCoords.latitude);
      const deltaLon = toRadians(longitude - userCoords.longitude);

      const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) ** 2;

      return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  isWithinRadius(
    latitude: number,
    longitude: number
  ): boolean {
    const userCoords = this.userCoords();
    if (!userCoords) {
      return false;
    }
    const distanceKm = this.getDistanceKm(latitude, longitude);
    return distanceKm <= this.userNearKm;
  }

  toggleMaximizedWidget(widgetId: string) {
    this.maximizedWidgetId = (this.maximizedWidgetId) ? undefined : widgetId;
  }

  goToMapCoords(lat: number, lng: number) {
    this.viewType.set('MAP');
    setTimeout(() => {
      this.leafletMapsService.setPosition({lat,lng, zoom: 12});
    }, 200);
  }

  ngOnInit(): void {

    this.userCoordsSubscription = this.getUserCoords().subscribe({
      next: (_res) => {
        //console.log('User coords loaded!', _res);
      }
    });

    // Init dates
    this.dateTo = new Date();
    this.dateFrom = moment().subtract(1, 'day').toDate();
    //this.onDateRangeChange({from: this.dateFrom, to: this.dateTo});

    // No socket data
    this.refreshSubscription = interval(5 * 60 * 1000).subscribe(() => {
      this.requestData();
    });

    // Seismic data (socketjs)
    this.seismicService.connect();
    this.seismicPortalSocketSubscription = this.seismicService.events$.subscribe(_seismicEvent => {
      this.seismicPortalEearthquakes.unshift(_seismicEvent);
      console.log('Added new seismic event', _seismicEvent);
    });

  }

  ngOnDestroy(): void {
    this.userCoordsSubscription?.unsubscribe();
    this.earthQuakeUsgsSubscription?.unsubscribe();
    this.nasaEonetSubscription?.unsubscribe();
    this.alertsLiveSubscription?.unsubscribe();
    this.cityAlertLiveSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
    this.whoDiseaseNewsSubscription?.unsubscribe();
    this.seismicPortalSocketSubscription?.unsubscribe();
    this.seismicPortalStoredEventsSubscription?.unsubscribe();
    this.gNewsServiceSubscription?.unsubscribe();
  }
}
