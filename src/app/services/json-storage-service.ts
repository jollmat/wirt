
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';
import { createClient } from '@supabase/supabase-js';
import { SeismicPortalEvent } from './seismic-portal-service';

@Injectable({
  providedIn: 'root'
})
export class JsonStorageService {

  private supabase = createClient(
    'https://tzvwdfhwtbdpxvsneqgp.supabase.co',
    'sb_publishable_CWo3AAXQKoh8M818eju6eQ_iJHoqL76'
  );

  private bucket = 'seismic_data';
  private filename = 'seismic_data.json';

  private get publicUrl(): string {
    const { data } = this.supabase.storage
      .from('seismic_data')
      .getPublicUrl('seismic_data.json');

    return data.publicUrl;
  }

  getEvents(): Observable<SeismicPortalEvent[]> {
    return this.http.get<SeismicPortalEvent[]>(
      this.publicUrl + '?v=' + Date.now()
    );
  }

  // SAVE / REPLACE events
  saveEvents(
    events: SeismicPortalEvent[]
  ): Observable<void> {

    const blob = new Blob(
      [JSON.stringify(events, null, 2)],
      { type: 'application/json' }
    );

    return from(
      this.supabase.storage
        .from('seismic_data')
        .upload('seismic_data.json', blob, {
          contentType: 'application/json',
          upsert: true
        })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  constructor(private http: HttpClient) {}
}
