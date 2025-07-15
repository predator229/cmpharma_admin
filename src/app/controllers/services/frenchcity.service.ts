import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FrenchCity {
  nom: string;
  code: string;
  codeDepartement: string;
  codeRegion: string;
  codesPostaux: string[];
  population: number;
}

@Injectable({
  providedIn: 'root'
})
export class FrenchCitiesService {
  private apiUrl = 'https://geo.api.gouv.fr/communes';

  constructor(private http: HttpClient) {}

  searchCities(query: string, limit: number = 10): Observable<FrenchCity[]> {
    return this.http.get<FrenchCity[]>(
      `${this.apiUrl}?nom=${query}&fields=nom,code,codeDepartement,codesPostaux,population&format=json&limit=${limit}`
    );
  }

  getBigCities(limit: number = 50): Observable<FrenchCity[]> {
    return this.http.get<FrenchCity[]>(
      `${this.apiUrl}?fields=nom,code,codeDepartement,codesPostaux,population&format=json&population=10000&limit=${limit}`
    );
  }
}
