import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox: [string, string, string, string];
}

export interface NominatimAddress {
  road?: string;
  neighbourhood?: string;
  town?: string;
  city?: string;
  village?: string;
  county?: string;
  province?: string;
  'ISO3166-2-lvl6'?: string;
  state?: string;
  'ISO3166-2-lvl4'?: string;
  postcode?: string;
  country: string;
  country_code: string;
}


export interface OSMLocation {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: OSMAddress;
  boundingbox: [string, string, string, string];
}

export interface OSMAddress {
  town?: string;
  city?: string;
  village?: string;
  municipality?: string;
  county?: string;
  province?: string;
  state?: string;
  country: string;
  country_code: string;
  [key: string]: string | undefined;
}


@Injectable({
  providedIn: 'root',
})
export class OpenStreetmapService {

  constructor(private http: HttpClient) {}

  getAddress(lat: number, lon: number): Observable<NominatimResponse> {
    const url = 'https://nominatim.openstreetmap.org/reverse';

    return this.http.get<NominatimResponse>(url, {
      params: {
        format: 'jsonv2',
        lat: lat.toString(),
        lon: lon.toString()
      }
    });
  }

  searchLocation(name: string): Observable<OSMLocation[]> {
    return this.http.get<OSMLocation[]>(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: name,
          format: 'jsonv2',
          limit: 10,
          addressdetails: 1
        }
      }
    );
  }

  getOSMAddressPath(address: NominatimAddress): string {
    const pathItems: string[] = [];
    if (address.village) {
      pathItems.push(address.village);
    }
    if (address.town) {
      pathItems.push(address.town);
    }
    if (address.county) {
      pathItems.push(address.county);
    }
    if (address.city) {
      pathItems.push(address.city);
    }
    if (address.province) {
      pathItems.push(address.province);
    }
    if (address.state) {
      pathItems.push(address.state);
    }
    if (address.country) {
      pathItems.push(address.country);
    }
    return pathItems.join(', ');
  }
  
}
