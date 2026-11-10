import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MapPositionInterface {
  lat: number; 
  lng: number;
  zoom: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeafletMapService {

  position = new BehaviorSubject<MapPositionInterface | undefined>(undefined);

  public setPosition(position: MapPositionInterface){
    this.position.next(position);
  }
  
}
