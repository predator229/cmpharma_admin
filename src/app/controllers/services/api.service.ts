import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.baseUrl; // 'http://192.168.1.129:5050/admin/api/';

  constructor(private http: HttpClient) {}

  get(endpoint: string, headers?: HttpHeaders): Observable<unknown> {
    return this.http.get(this.baseUrl + endpoint, { headers });
  }
  fullUrlGet(endpoint: string, headers?: HttpHeaders): Observable<unknown> {
    return this.http.get(endpoint, { headers });
  }

  post(endpoint: string, data: unknown, headers?: HttpHeaders): Observable<unknown> {
    return this.http.post(this.baseUrl + endpoint, data, { headers });
  }
  fullUrlPost(endpoint: string, data: unknown, headers?: HttpHeaders): Observable<unknown> {
    return this.http.post(this.baseUrl + endpoint, data, { headers });
  }
  put(endpoint: string, data: unknown, headers?: HttpHeaders): Observable<unknown> {
    return this.http.put(this.baseUrl + endpoint, data, { headers });
  }

  delete(endpoint: string, headers?: HttpHeaders): Observable<unknown> {
    return this.http.delete(this.baseUrl + endpoint, { headers });
  }
}
