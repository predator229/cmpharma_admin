import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { app } from '../../firebase.config';
import { ApiService } from './api.service';
import { map, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiUserDetails } from 'src/app/models/ApiUserDetails';
import { UserDetails } from 'src/app/models/UserDatails';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth(app);
  private currentUser: User | null = null;
  private userDetails: UserDetails | null = null;
  private userDetailsLoaded = false;

  constructor(private apiService: ApiService, private router: Router) {
    this.listenToAuthChanges();
  }

  private listenToAuthChanges() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      if (user) {
        try {
          await this.loadUserDetails();
          this.userDetailsLoaded = true;
        } catch (error) {
          console.error('Erreur lors de la récupération des détails utilisateur', error);
          this.userDetailsLoaded = false;
        }
      } else {
        this.clearStorage();
        this.userDetailsLoaded = false;
      }
    });
  }

  private async loadUserDetails(): Promise<void> {
    const token = await this.getRealToken();
    if (!token) throw new Error('Pas de token utilisateur');

    const uid = this.getUid();
    if (!uid) throw new Error('Pas d’UID utilisateur');

    const headers = new HttpHeaders({
      'Origin': '*',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const apiResponse = await firstValueFrom(
      this.apiService.post('users/authentificate', { uid }, headers)
      .pipe(
      map((response: ApiUserDetails): UserDetails | null => {
        try {
        return UserDetails.fromApiResponse(response);
        } catch (error) {
        console.error('Erreur lors de la transformation de la réponse API', error);
        return null;
        }
      }),
      catchError(error => {
        console.error('Erreur API lors de la récupération des détails utilisateur', error);
        return of(null);
      })
      )
    );
    if (!apiResponse) {
      this.logout();
    } else {
      localStorage.setItem('user', JSON.stringify(this.currentUser));
      localStorage.setItem('userDetails', JSON.stringify(apiResponse));

      const userDetails = JSON.parse(JSON.stringify(apiResponse));
      this.userDetails = userDetails;
    }
  }

  private clearStorage() {
    localStorage.removeItem('user');
    localStorage.removeItem('userDetails');
  }

  loginWithEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  getUid(): string | null {
    return this.currentUser ? this.currentUser.uid : null;
  }

  async getRealToken(): Promise<string | null> {
    return this.currentUser ? await this.currentUser.getIdToken(true) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserDetails(): UserDetails | null {
    return this.userDetails;
  }

  isUserDetailsLoaded(): boolean {
    return this.userDetailsLoaded;
  }
}
