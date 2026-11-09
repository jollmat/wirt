import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { WhoDiseaseNewsInterface } from '../model/who-disease-news/interfaces/who-disease-news.interface';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WhoDiseaseNewsService {
  private http = inject(HttpClient);

  getWhoDiseaseNews(dateFrom: Date, dateTo: Date): Observable<WhoDiseaseNewsInterface[]> {
    return this.http.get<{value: WhoDiseaseNewsInterface[]}>('https://www.who.int/api/news/diseaseoutbreaknews').pipe(
      map((_res) => {
        return _res.value.filter((_newsItem) => {
          _newsItem.DateCreated = new Date(_newsItem.DateCreated);
          _newsItem.LastModified = new Date(_newsItem.LastModified);
          _newsItem.PublicationDate = new Date(_newsItem.PublicationDate);
          return _newsItem.LastModified.getTime()>=dateFrom.getTime() && _newsItem.LastModified.getTime()<=dateTo.getTime();
        });
      })
    );
  }
}
