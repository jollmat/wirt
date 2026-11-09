import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  of,
  throwError
} from 'rxjs';

import {
  catchError,
  finalize,
  shareReplay,
  tap
} from 'rxjs/operators';

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

interface CacheData {
  timestamp: number;
  data: GNewsResponse;
}

@Injectable({
  providedIn: 'root'
})
export class GNewsService {

  private http = inject(HttpClient);

  private readonly API_URL = 'https://gnews.io/api/v4/search';

  private readonly API_KEY = '4a1bcb18c9cd67779d0c5890a0db0704';

  private readonly CACHE_KEY = 'gnews_futbol_es_v1';

  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hora

  private request$?: Observable<GNewsResponse>;

  obtenerNoticias(): Observable<GNewsResponse> {

    // Comprobar caché vigente
    const cache = this.obtenerCache();

    if (cache) {
      console.log('Noticias obtenidas desde caché');
      return of(cache);
    }

    // Evitar peticiones simultáneas
    if (this.request$) {
      return this.request$;
    }

    const params = new HttpParams()
      .set('q', 'football OR soccer OR fútbol')
      .set('lang', 'es')
      .set('max', '10')
      .set('sortby', 'publishedAt')
      .set('apikey', this.API_KEY);

    this.request$ = this.http
      .get<GNewsResponse>(this.API_URL, { params })
      .pipe(

        tap(data => {
          this.guardarCache(data);
          console.log('Noticias descargadas desde GNews');
        }),

        catchError(error => {

          // Recuperar última respuesta aunque haya caducado
          const cacheAntigua = this.obtenerCache(true);

          if (cacheAntigua) {
            console.warn('Usando caché antigua');
            return of(cacheAntigua);
          }

          return throwError(() => error);
        }),

        // Compartir respuesta entre suscriptores
        shareReplay(1),

        // Permitir nuevas peticiones cuando termine
        finalize(() => {
          this.request$ = undefined;
        })
      );

    return this.request$;
  }

  private guardarCache(data: GNewsResponse): void {

    if (typeof localStorage === 'undefined') return;

    try {
      const cache: CacheData = {
        timestamp: Date.now(),
        data
      };

      localStorage.setItem(
        this.CACHE_KEY,
        JSON.stringify(cache)
      );

    } catch (error) {
      console.warn('No se pudo guardar la caché', error);
    }
  }

  private obtenerCache(
    permitirCaducada = false
  ): GNewsResponse | null {

    if (typeof localStorage === 'undefined') return null;

    try {
      const almacenado = localStorage.getItem(
        this.CACHE_KEY
      );

      if (!almacenado) return null;

      const cache: CacheData = JSON.parse(almacenado);

      const antiguedad = Date.now() - cache.timestamp;

      if (
        cache.timestamp > Date.now() ||
        antiguedad < 0
      ) {
        return null;
      }

      if (
        !permitirCaducada &&
        antiguedad >= this.CACHE_DURATION
      ) {
        return null;
      }

      return cache.data;

    } catch {
      return null;
    }
  }

  limpiarCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    this.request$ = undefined;
  }
}
