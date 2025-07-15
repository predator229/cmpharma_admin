import {Component, Input, Output, EventEmitter, OnInit, AfterViewInit, SimpleChanges, OnDestroy} from '@angular/core';
import * as L from 'leaflet';
import {CommonModule, DecimalPipe, NgStyle} from "@angular/common";
import {Country} from "../../models/Country.class";
import {LoadingService} from "../../controllers/services/loading.service";
import {ZoneCoordinates} from "../../models/ZoneCoordinates.class";
import {Location} from "../../models/Location";
import {DeliveryZoneClass} from "../../models/DeliveryZone.class";
import 'leaflet-draw'; // Import pour les types et extensions

// Déclaration des types pour leaflet-draw
declare module 'leaflet' {
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: any);
    }
  }

  namespace Draw {
    namespace Event {
      const CREATED: string;
      const EDITED: string;
      const DELETED: string;
    }
  }

  // class FeatureGroup extends L.FeatureGroup {
  //   constructor();
  // }
}

export interface CityBounds {
  northEast: { lat: number, lng: number };
  southWest: { lat: number, lng: number };
}

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  imports: [
    NgStyle,
    DecimalPipe,
    CommonModule
  ],
  styleUrls: ['./map-selector.component.scss']
})
export class MapSelectorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mapId: string = 'map-' + Math.random().toString(36).substr(2, 9);
  @Input() readonly: boolean = false;
  @Input() lat: number;
  @Input() lng: number;
  @Input() city: string;
  @Input() country: Country | null;
  @Input() height: string = '400px';

  @Input() selectionMode: 'point' | 'zone' = 'point';
  @Input() deliveryZone : DeliveryZoneClass | null;
  zoneCoordinates: ZoneCoordinates | null = null;

  // Événements
  @Output() positionChange = new EventEmitter<{ lat: number, lng: number }>();
  @Output() zoneChange = new EventEmitter<ZoneCoordinates>();

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  private zoneLayer: L.Polygon | undefined;
  private cityBoundsLayer: L.Rectangle | undefined;
  isDrawing: boolean = false;
  private polygonPoints: L.LatLng[] = [];
  private temporaryMarkers: L.Marker[] = [];
  private cityBounds: CityBounds | null = null;
  private locationError: string = '';
  private isLoadingLocation: boolean = false;
  private drawControl: L.Control.Draw | undefined;
  private drawnItems: L.FeatureGroup | undefined;

  constructor(private loadingService: LoadingService) {
    this.loadingService.isLoading$.subscribe((loading) => { this.isLoadingLocation = loading; });
  }

  private syncPolygonWithZone(latlngs: L.LatLng[]) {
    this.zoneCoordinates = {
      points: latlngs.map(ll => new Location({ latitude: ll.lat, longitude: ll.lng }))
    };
    this.zoneChange.emit(this.zoneCoordinates);
  }

  async ngOnInit(): Promise<void> {
    if (!this.isValidCoordinates(this.lat, this.lng)) {
      if (this.city && this.country != null) {
        try {
          await this.geocodeFromCityCountry();
          if (!this.isValidCoordinates(this.lat, this.lng)) { await this.requestCurrentLocation(); }
        } catch (error) {
          console.warn('Erreur lors du géocodage:', error);
        }
      }
    }
    if (!this.isValidCoordinates(this.lat, this.lng)) { this.handleGeolocationError(null);}
  }

  private isValidCoordinates(lat?: number, lng?: number): boolean {
    return lat !== undefined &&
      lng !== undefined &&
      lat !== null &&
      lng !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;
  }

  private async geocodeFromCityCountry(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.city || this.country == null) {
        reject('Ville ou pays manquant');
        return;
      }
      const geocoder = new google.maps.Geocoder();
      const address = `${this.city}, ${this.country.name}`;

      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          if (location) {
            this.lat = location.lat();
            this.lng = location.lng();
            resolve();
          }
          return;
        } else {
          reject(`Géocodage échoué: ${status}`);
        }
      });
    });
  }

  private async requestCurrentLocation(): Promise<void> {
    if (!navigator.geolocation) {
      this.locationError = 'La géolocalisation n\'est pas supportée par ce navigateur';
      console.error(this.locationError);
      return;
    }

    this.isLoadingLocation = true;
    this.locationError = undefined;

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
          this.isLoadingLocation = false;
          console.log('Position actuelle obtenue:', this.lat, this.lng);
          resolve();
        },
        (error) => {
          this.isLoadingLocation = false;
          this.handleGeolocationError(error);
          reject(error);
        },
        options
      );
    });
  }

  private handleGeolocationError(error: GeolocationPositionError | null): void {
    if (error) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          this.locationError = 'Permission de géolocalisation refusée par l\'utilisateur';
          break;
        case error.POSITION_UNAVAILABLE:
          this.locationError = 'Informations de localisation indisponibles';
          break;
        case error.TIMEOUT:
          this.locationError = 'Délai d\'attente dépassé pour obtenir la localisation';
          break;
        default:
          this.locationError = 'Une erreur inconnue s\'est produite lors de la géolocalisation';
          break;
      }
      console.error('Erreur de géolocalisation:', this.locationError);
    }
    this.setDefaultLocation();
  }

  ngAfterViewInit(): void {
    this.initializeMap(this.mapId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      if (this.marker && (changes['lat'] || changes['lng'])) {
        this.updateMapPosition();
      }

      if (changes['zoneCoordinates'] && this.selectionMode === 'zone') {
        this.updateZoneDisplay();
      }

      if (changes['selectionMode']) {
        this.updateSelectionMode();
      }
    }
  }

  private setDefaultLocation(): void {
    this.lat = 48.8566;
    this.lng = 2.3522;
  }

  public async refreshLocation(): Promise<void> {
    this.lat = undefined;
    this.lng = undefined;
    await this.requestCurrentLocation();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private updateMapPosition(): void {
    if (this.lat && this.lng && this.map && this.marker) {
      const newLatLng = [this.lat, this.lng] as L.LatLngExpression;
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom());
    }
  }

  private updateZoneDisplay(): void {
    if (this.zoneLayer) {
      this.map?.removeLayer(this.zoneLayer);
    }

    this.clearTemporaryMarkers();

    if (this.zoneCoordinates && this.zoneCoordinates.points.length >= 3) {
      const latlngs = this.zoneCoordinates.points.map(point => [point.latitude, point.longitude] as L.LatLngExpression);

      this.zoneLayer = L.polygon(latlngs, {
        color: '#ff7800',
        weight: 2,
        fillOpacity: 0.2,
        fillColor: '#ff7800'
      }).addTo(this.map!);

      if (!this.readonly) {
        this.addPolygonMarkers();
      }
    }
  }

  private addPolygonMarkers(): void {
    if (!this.zoneCoordinates) return;

    this.zoneCoordinates.points.forEach((point, index) => {
      const marker = L.marker([point.latitude, point.longitude], {
        draggable: true,
        icon: L.divIcon({
          className: 'polygon-vertex',
          html: `<div style="background: #ff7800; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px;"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        })
      });

      marker.on('drag', () => {
        this.updatePolygonPoint(index, marker.getLatLng());
      });

      marker.on('dragend', () => {
        this.emitZoneChange();
      });

      // Double-clic pour supprimer un point (si plus de 3 points)
      marker.on('dblclick', () => {
        if (this.zoneCoordinates!.points.length > 3) {
          this.removePolygonPoint(index);
        }
      });

      marker.addTo(this.map!);
      this.temporaryMarkers.push(marker);
    });
  }

  private updatePolygonPoint(index: number, newLatLng: L.LatLng): void {
    if (!this.zoneCoordinates) return;

    const constrainedLatLng = this.constrainToCityBounds(newLatLng);
    this.zoneCoordinates.points[index] = {
      latitude: constrainedLatLng.lat,
      longitude: constrainedLatLng.lng
    };

    // Mettre à jour le polygone
    if (this.zoneLayer) {
      const latlngs = this.zoneCoordinates.points.map(point => [point.latitude, point.longitude] as L.LatLngExpression);
      this.zoneLayer.setLatLngs(latlngs);
    }
  }

  private removePolygonPoint(index: number): void {
    if (!this.zoneCoordinates || this.zoneCoordinates.points.length <= 3) return;

    this.zoneCoordinates.points.splice(index, 1);
    this.updateZoneDisplay();
    this.emitZoneChange();
  }

  private clearTemporaryMarkers(): void {
    this.temporaryMarkers.forEach(marker => {
      this.map?.removeLayer(marker);
    });
    this.temporaryMarkers = [];
  }

  private updateSelectionMode(): void {
    if (this.selectionMode === 'point') {
      if (this.marker) {
        this.marker.addTo(this.map!);
      }
      if (this.zoneLayer) {
        this.map?.removeLayer(this.zoneLayer);
      }
      this.clearTemporaryMarkers();
      // Supprimer le contrôle de dessin si il existe
      if (this.drawControl) {
        this.map?.removeControl(this.drawControl);
        this.drawControl = undefined;
      }
    } else {
      if (this.marker) {
        this.map?.removeLayer(this.marker);
      }
      this.updateZoneDisplay();
      // Ajouter le contrôle de dessin
      this.addDrawControl();
    }
  }

  private addDrawControl(): void {
    if (!this.map || this.readonly || this.drawControl) return;

    this.drawnItems = new L.FeatureGroup().addTo(this.map);

    this.drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#ff7800',
            weight: 2,
            fillOpacity: 0.2
          }
        },
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    });

    this.map.addControl(this.drawControl);

    // Événements de dessin
    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      if (e.layerType === 'polygon') {
        this.drawnItems?.clearLayers();
        this.drawnItems?.addLayer(e.layer);
        this.syncPolygonWithZone(e.layer.getLatLngs()[0]);
      }
    });

    this.map.on(L.Draw.Event.EDITED, (e: any) => {
      const layer = e.layers.getLayers()[0];
      if (layer) {
        this.syncPolygonWithZone(layer.getLatLngs()[0]);
      }
    });

    this.map.on(L.Draw.Event.DELETED, () => {
      this.zoneCoordinates = null;
      this.zoneChange.emit(null as any);
    });
  }

  private async initializeMap(containerId: string): Promise<void> {
    const defaultLatLng = [this.lat, this.lng] as L.LatLngExpression;
    const mapContainer = document.getElementById(containerId);

    // Créer la carte avec L.map (pas Ldraw.map)
    this.map = L.map(mapContainer!).setView(defaultLatLng, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Obtenir les limites de la ville seulement pour le mode point
    if (this.selectionMode === 'point') {
      await this.getCityBounds();
    }

    this.marker = L.marker(defaultLatLng, {
      draggable: !this.readonly
    });

    // Configurer selon le mode de sélection
    if (this.selectionMode === 'point') {
      this.marker.addTo(this.map);
      this.positionChange.emit({lat: this.lat, lng: this.lng});
    } else {
      // Mode zone
      this.zoneCoordinates = this.deliveryZone?.coordinates || null;
      this.updateZoneDisplay();

      // Ajouter le contrôle de dessin
      this.addDrawControl();
    }

    if (!this.readonly) {
      this.setupMapEvents();
    }
  }

  private async getCityBounds(): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.lat}&lon=${this.lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.boundingbox) {
        const [south, north, west, east] = data.boundingbox.map(Number);
        this.cityBounds = {
          northEast: { lat: north, lng: east },
          southWest: { lat: south, lng: west }
        };

        if (this.cityBounds && this.map) {
          const bounds = L.latLngBounds(
            [this.cityBounds.southWest.lat, this.cityBounds.southWest.lng],
            [this.cityBounds.northEast.lat, this.cityBounds.northEast.lng]
          );

          this.cityBoundsLayer = L.rectangle(bounds, {
            color: '#red',
            weight: 1,
            fillOpacity: 0.05,
            dashArray: '10, 10'
          }).addTo(this.map);
        }
      }
    } catch (error) {
      console.warn('Impossible de récupérer les limites de la ville:', error);
      this.cityBounds = this.createDefaultCityBounds();
    }
  }

  private createDefaultCityBounds(): CityBounds {
    const offset = 50 / 111; // 50 km en degrés
    return {
      northEast: { lat: this.lat + offset, lng: this.lng + offset },
      southWest: { lat: this.lat - offset, lng: this.lng - offset }
    };
  }

  private createDefaultZone(): void {
    if (!this.zoneCoordinates) {
      this.zoneCoordinates = { points: [] };
    }

    const center = { lat: this.lat, lng: this.lng };
    const radius = 20 / 111; // 20 km de rayon en degrés
    const sides = 8;
    const points: Location[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const lat = center.lat + radius * Math.cos(angle);
      const lng = center.lng + radius * Math.sin(angle);
      points.push({ latitude: lat, longitude: lng });
    }

    this.zoneCoordinates.points = points;
    this.zoneChange.emit(this.zoneCoordinates);
  }

  private setupMapEvents(): void {
    if (this.selectionMode === 'point') {
      this.setupPointSelection();
    } else {
      this.setupZoneSelection();
    }
  }

  private setupPointSelection(): void {
    this.map?.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.marker?.setLatLng([lat, lng]);
      this.positionChange.emit({ lat, lng });
    });
  }

  private setupZoneSelection(): void {
    this.map?.on('click', (e: any) => {
      if (this.isDrawing) {
        const constrainedLatLng = this.constrainToCityBounds(e.latlng);
        this.polygonPoints.push(constrainedLatLng);

        // Ajouter un marqueur temporaire
        const marker = L.marker(constrainedLatLng, {
          icon: L.divIcon({
            className: 'polygon-vertex-temp',
            html: `<div style="background: #ff7800; border: 2px solid white; border-radius: 50%; width: 10px; height: 10px;"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5]
          })
        }).addTo(this.map!);

        this.temporaryMarkers.push(marker);

        // Si on a au moins 3 points, dessiner le polygone temporaire
        if (this.polygonPoints.length >= 3) {
          if (this.zoneLayer) {
            this.map?.removeLayer(this.zoneLayer);
          }

          const latlngs = this.polygonPoints.map(point => [point.lat, point.lng] as L.LatLngExpression);
          this.zoneLayer = L.polygon(latlngs, {
            color: '#ff7800',
            weight: 2,
            fillOpacity: 0.2,
            fillColor: '#ff7800',
            dashArray: '5, 5'
          }).addTo(this.map!);
        }
      }
    });

    this.map?.on('dblclick', (e: any) => {
      if (this.isDrawing && this.polygonPoints.length >= 3) {
        // Finaliser le polygone
        this.finishPolygon();
      }
    });

    // Raccourci clavier pour commencer/terminer le dessin
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.selectionMode === 'zone') {
        if (!this.isDrawing) {
          this.startPolygonDrawing();
        } else if (this.polygonPoints.length >= 3) {
          this.finishPolygon();
        }
      }
      if (e.key === 'Escape' && this.isDrawing) {
        this.cancelPolygonDrawing();
      }
    });
  }

  private startPolygonDrawing(): void {
    this.isDrawing = true;
    this.polygonPoints = [];
    this.clearTemporaryMarkers();

    if (this.zoneLayer) {
      this.map?.removeLayer(this.zoneLayer);
    }

    if (this.map) {
      this.map.getContainer().style.cursor = 'crosshair';
    }

    console.log('Cliquez pour ajouter des points au polygone. Double-cliquez ou appuyez sur Entrée pour terminer.');
  }

  private finishPolygon(): void {
    if (this.polygonPoints.length < 3) return;

    this.isDrawing = false;
    if (this.map) {
      this.map.getContainer().style.cursor = '';
    }

    if (this.zoneLayer) {
      this.map?.removeLayer(this.zoneLayer);
    }

    this.zoneCoordinates = {
      points: this.polygonPoints.map(point => new Location({
        latitude: point.lat,
        longitude: point.lng
      }))
    };

    this.polygonPoints = [];

    this.updateZoneDisplay();
    this.emitZoneChange();
  }

  private cancelPolygonDrawing(): void {
    this.isDrawing = false;
    this.polygonPoints = [];
    if (this.map) {
      this.map.getContainer().style.cursor = '';
    }
    this.clearTemporaryMarkers();

    if (this.zoneLayer) {
      this.map?.removeLayer(this.zoneLayer);
    }
  }

  private constrainToCityBounds(latlng: L.LatLng): L.LatLng {
    if (!this.cityBounds) {
      return latlng;
    }

    const constrainedLat = Math.max(
      this.cityBounds.southWest.lat,
      Math.min(this.cityBounds.northEast.lat, latlng.lat)
    );

    const constrainedLng = Math.max(
      this.cityBounds.southWest.lng,
      Math.min(this.cityBounds.northEast.lng, latlng.lng)
    );

    return L.latLng(constrainedLat, constrainedLng);
  }

  private emitZoneChange(): void {
    if (this.zoneCoordinates) {
      this.zoneChange.emit(this.zoneCoordinates);
    }
  }

  public setSelectionMode(mode: 'point' | 'zone'): void {
    this.selectionMode = mode;

    if (mode === 'zone' && !this.zoneCoordinates) {
      this.createDefaultZone();
    }

    this.updateSelectionMode();
    this.map?.off();

    if (!this.readonly) {
      this.setupMapEvents();
    }
  }

  public clearSelection(): void {
    if (this.selectionMode === 'zone') {
      if (this.zoneLayer) {
        this.map?.removeLayer(this.zoneLayer);
        this.zoneLayer = undefined;
      }
      this.clearTemporaryMarkers();
      this.zoneCoordinates = null;
      this.zoneChange.emit(null as any);

      // Nettoyer les éléments dessinés
      this.drawnItems?.clearLayers();
    }
  }

  public resetToDefaultZone(): void {
    if (this.selectionMode === 'zone') {
      this.createDefaultZone();
      this.updateZoneDisplay();
    }
  }

  public startDrawing(): void {
    if (this.selectionMode === 'zone' && !this.readonly) {
      this.startPolygonDrawing();
    }
  }

  public getZoneAreaInKm(): number {
    if (!this.zoneCoordinates || this.zoneCoordinates.points.length < 3) return 0;

    // Utiliser la formule de Shoelace pour calculer l'aire d'un polygone
    const points = this.zoneCoordinates.points;
    let area = 0;

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].latitude * points[j].longitude;
      area -= points[j].latitude * points[i].longitude;
    }

    area = Math.abs(area) / 2;

    // Conversion approximative en km² (1 degré ≈ 111 km)
    const kmConversion = 111 * 111 * Math.cos((this.lat * Math.PI) / 180);
    return area * kmConversion;
  }
}
