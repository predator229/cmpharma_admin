import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://192.168.1.128:5050/admin/api/';

  constructor(private http: HttpClient) {}

  get(endpoint: string, headers?: HttpHeaders): Observable<unknown> {
    return this.http.get(this.baseUrl + endpoint, { headers });
  }

  post(endpoint: string, data: unknown, headers?: HttpHeaders): Observable<unknown> {
    return this.http.post(this.baseUrl + endpoint, data, { headers });
  }

  put(endpoint: string, data: unknown, headers?: HttpHeaders): Observable<unknown> {
    return this.http.put(this.baseUrl + endpoint, data, { headers });
  }

  delete(endpoint: string, headers?: HttpHeaders): Observable<unknown> {
    return this.http.delete(this.baseUrl + endpoint, { headers });
  }
}
