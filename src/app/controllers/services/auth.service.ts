import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, UserCredential, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../../firebase.config';
import { ApiService } from './api.service';
import { map, catchError } from 'rxjs/operators';
import { of, BehaviorSubject } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { ApiUserDetails } from 'src/app/models/ApiUserDetails';
import { UserDetails } from 'src/app/models/UserDatails';
import Swal from "sweetalert2";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth(app);
  private currentUser: User | null = null;
  private userDetails: UserDetails | null = null;
  private userDetailsLoaded = false;
  public userDetailsLoaded$ = new BehaviorSubject<boolean>(false);
  public userDetails$ = new BehaviorSubject<UserDetails | null>(null);

  constructor(private apiService: ApiService, private router: Router) {
    this.listenToAuthChanges();
  }

  private listenToAuthChanges() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      if (user) {
        const success = await this.tryLoadUserDetails();
        this.setUserDetailsLoaded(success);
      } else {
        this.clearStorage();
        this.setUserDetailsLoaded(true);
      }
    });
  }

  private async tryLoadUserDetails(): Promise<boolean> {
    try {
      const token = await this.getRealToken();
      const uid = this.getUid();

      if (!token || !uid) throw new Error('Token ou UID manquant');

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });

      const response = await this.apiService.post('users/authentificate', { uid }, headers).pipe(
        map((res: ApiUserDetails) => UserDetails.fromApiResponse(res)),
        catchError(error => {
          console.error('Erreur API', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur s\'est produite lors de la connectiopn avec le serveur. Veuillez reassayer !',
          });
          return of(null);  // Retourne une Observable avec null en cas d'erreur
        })
      ).toPromise();


      if (!response) {
        this.logout();
        return false;
      }

      localStorage.setItem('user', JSON.stringify(this.currentUser));
      localStorage.setItem('userDetails', JSON.stringify(response));

      this.userDetails = response;
      this.userDetails$.next(response);
      return true;

    } catch (error) {
      console.error('Erreur lors du chargement des détails utilisateur', error);
      return false;
    }
  }

  private setUserDetailsLoaded(state: boolean) {
    this.userDetailsLoaded = state;
    this.userDetailsLoaded$.next(state);
  }


  private clearStorage() {
    localStorage.removeItem('user');
    localStorage.removeItem('userDetails');
    this.userDetails = null;
    this.userDetails$.next(null);
  }

  public loginWithEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  public loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  public async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.warn('Erreur lors de la déconnexion Firebase :', error);
    } finally {
      this.clearStorage();
      this.router.navigate(['/login']);
    }
  }

  public getUid(): string | null {
    return this.currentUser ? this.currentUser.uid : null;
  }

  public async getRealToken(): Promise<string | null> {
    return this.currentUser ? await this.currentUser.getIdToken(true) : null;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getUserDetails(): UserDetails | null {
    return this.userDetails;
  }

  public async editprofilInfos (name: string, surname: string) {

    if (!name || !surname) throw new Error('Veuillez remplir tous les champs');
    const token = await this.getRealToken();
    if (!token) throw new Error('Pas de token utilisateur');

    const uid = this.getUid();
    if (!uid) throw new Error('Pas d’UID utilisateur');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const apiResponse = await this.apiService.post('users/set-profil-info', { uid, name, surname }, headers)
      .pipe(
        map((response: ApiUserDetails): UserDetails | null => {
          try {
            return UserDetails.fromApiResponse(response);
          } catch (error) {
            this.userDetailsLoaded = false;
            this.userDetailsLoaded$.next(false);
            console.error('Erreur lors de la transformation de la réponse API', error);
            return null;
          }
        }),
        catchError(error => {
          this.userDetailsLoaded = false;
          this.userDetailsLoaded$.next(false);
          this.userDetails = null;
          this.userDetails$.next(null);
          console.error('Erreur API lors de la récupération des détails utilisateur', error);
          return of(null);
        })
      )
      .toPromise();
  }

  public sendResetPasswordEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  async editSettingsUser(font: string) {
    if (!font) throw new Error('Veuillez remplir tous les champs');
    const token = await this.getRealToken();
    if (!token) throw new Error('Pas de token utilisateur');

    const uid = this.getUid();
    if (!uid) throw new Error('Pas d’UID utilisateur');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    const apiResponse = await this.apiService.post('users/set-setings-font', { uid, font }, headers)
      .pipe(
        map((response: ApiUserDetails): UserDetails | null => {
          try {
            return UserDetails.fromApiResponse(response);
          } catch (error) {
            this.userDetailsLoaded = false;
            this.userDetailsLoaded$.next(false);
            console.error('Erreur lors de la transformation de la réponse API', error);
            return null;
          }
        }),
        catchError(error => {
          this.userDetailsLoaded = false;
          this.userDetailsLoaded$.next(false);
          this.userDetails = null;
          this.userDetails$.next(null);
          console.error('Erreur API lors de la récupération des détails utilisateur', error);
          return of(null); // Retourne un observable avec `null` en cas d'erreur
        })
      )
      .toPromise();  // Utilisation de toPromise pour convertir l'Observable en Promesse
  }
}
