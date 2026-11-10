import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { LeafletMapService } from '../../../../services/leaflet-map-service';
import { Subscription } from 'rxjs';

export interface MapLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  icon?: string;
  color?: string;
}

export type MapType = 'openstreet' | 'satellite' | 'terrain' | 'esristreets' | 'topographic';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [LeafletModule, CommonModule],
  templateUrl: './leaflet-map.html',
  styleUrl: './leaflet-map.scss',
})
export class LeafletMap implements OnChanges, OnInit, OnDestroy {
  
  private leafletMapsService = inject(LeafletMapService);
  goToPositionSubscription?: Subscription;
  
  @Input() locations: MapLocation[] = [];
  @Input() userRadius?: {lat?: number, lon?: number, radiusKm?: number};

  map!: L.Map;
    mapType: MapType = 'openstreet';

  private currentTileLayer?: L.TileLayer;

  private circle?: L.Circle;

  markerLayers: L.Layer[] = [];

  options: L.MapOptions = {
    layers: [
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }
      )
    ],
    zoom: 8,
    center: L.latLng(41.5, 2)
  };

  private readonly mapLayers: Record<MapType, {
    url: string;
    attribution: string;
    maxZoom: number;
  }> = {
    openstreet: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap contributors',
      maxZoom: 17
    },
    esristreets: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; OpenTopoMap contributors',
      maxZoom: 17
    },
    topographic: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; OpenTopoMap contributors',
      maxZoom: 17
    }
  };

  onMapReady(map: L.Map): void {
    this.map = map;
  }

  changeMapType(type: MapType): void {
    if (!this.map) return;

    const config = this.mapLayers[type];

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    this.currentTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom
    });

    this.currentTileLayer.addTo(this.map);

    this.mapType = type;
  }

  createIcon(icon: string, color: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div style="
          background: ${color};
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,.35);
        ">
          <i class="fa-solid ${icon}" style="
            transform: rotate(45deg);
            font-size: 17px;
          "></i>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
    });
  }

  private updateMarkers(): void {

    this.markerLayers = this.locations.map(location => {

      const popupContent = '<strong>' + location.name + '</strong><br />' + location.description;

      return L.marker(
        [location.latitude, location.longitude],
        {
          icon: this.createIcon(
            location.icon || 'fa-location-dot',
            location.color || '#0d6efd'
          )
        }
      ).bindPopup(popupContent);
    });
    
  }

  private updateRadiusCircle(): void {
    if (!this.map) return;

    // Always remove the previous circle first.
    if (this.circle) {
      this.map.removeLayer(this.circle);
      this.circle = undefined;
    }

    // Check that all parameters are valid.
    if (
      !this.userRadius ||
      this.userRadius.lat == null ||
      this.userRadius.lon == null ||
      this.userRadius.radiusKm == null ||
      this.userRadius.radiusKm <= 0
    ) {
      return;
    }

    // Create the new radius circle.
    this.circle = L.circle(
      [
        this.userRadius.lat,
        this.userRadius.lon
      ],
      {
        radius: this.userRadius.radiusKm * 1000,

        color: '#007bff',
        weight: 2,
        opacity: 0.8,

        fillColor: '#007bff',
        fillOpacity: 0.15,

        interactive: false
      }
    ).addTo(this.map);
  }

  /*
  private updateMapBounds(): void {
    if (!this.map || this.markerLayers.length === 0) {
      return;
    }
    
    const bounds = L.featureGroup(
      this.markerLayers as L.Marker[]
    ).getBounds();

    this.map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 13
    });
  }
  */

  private setMapView(lat: number, lng: number, zoom: number): void {
    if (!this.map) return;
    this.map.setView([lat, lng], zoom);
  }

  ngOnInit(): void {
    this.goToPositionSubscription = this.leafletMapsService.position.subscribe({
      next: (_position) => {
        if (_position) {
          this.setMapView(_position.lat, _position.lng, _position.zoom);
        }
      }
    });
  }

  ngOnChanges(): void {
    this.updateMarkers();
    this.updateRadiusCircle();
  }

  ngOnDestroy(): void {
    this.goToPositionSubscription?.unsubscribe();
  }
}