import { AfterViewInit, Component, ElementRef, ViewChild, Input } from '@angular/core';
import {NgStyle} from "@angular/common";

declare const google: any;

@Component({
  selector: 'app-map',
  template: `
    <div #map [ngStyle]="{
        height: height,
        width: width
      }"></div>`,
  imports: [
    NgStyle
  ]
})
export class MapComponent implements AfterViewInit {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  @Input() latitude!: number;
  @Input() longitude!: number;
  @Input() title: string = 'Emplacement';
  @Input() zoom: number = 15;
  @Input() height: number = 400;
  @Input() width: number = 100;


  ngAfterViewInit(): void {
    if (this.latitude == null || this.longitude == null) {
      console.error('Latitude et Longitude sont requis');
      return;
    }

    const center = { lat: this.latitude, lng: this.longitude };

    const map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 15,
      center,
    });

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: center,
      title: this.title,
    });
  }
}
