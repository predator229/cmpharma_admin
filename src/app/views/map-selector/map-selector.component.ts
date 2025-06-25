import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import {NgStyle} from "@angular/common";

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  imports: [
    NgStyle
  ],
  styleUrls: ['./map-selector.component.scss']
})
export class MapSelectorComponent implements OnInit, AfterViewInit {
  @Input() readonly: boolean = false;
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() height: string = '400px';
  @Output() positionChange = new EventEmitter<{ lat: number, lng: number }>();

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    const defaultLatLng = this.lat && this.lng ? [this.lat, this.lng] : [0, 0];

    this.map = L.map('map').setView(defaultLatLng as L.LatLngExpression, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Marker initial
    this.marker = L.marker(defaultLatLng as L.LatLngExpression, {
      draggable: !this.readonly
    }).addTo(this.map);

    // Déplacement du marqueur si clic autorisé
    if (!this.readonly) {
      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.marker?.setLatLng([lat, lng]);
        this.positionChange.emit({ lat, lng });
      });
    }

    if (!this.lat || !this.lng) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        this.map?.setView(coords as L.LatLngExpression, 13);
        this.marker?.setLatLng(coords as L.LatLngExpression);
        this.positionChange.emit({ lat: coords[0], lng: coords[1] });
      });
    } else {
      this.positionChange.emit({ lat: this.lat, lng: this.lng });
    }
  }
}
