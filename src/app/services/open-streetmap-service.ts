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

@Injectable({
  providedIn: 'root',
})
export class OpenStreetmapService {

  constructor(private http: HttpClient) {}

  getAddress(lat: number, lon: number): Observable<any> {
    const url = 'https://nominatim.openstreetmap.org/reverse';

    return this.http.get<NominatimResponse>(url, {
      params: {
        format: 'jsonv2',
        lat: lat.toString(),
        lon: lon.toString()
      }
    });
  }
  
}
