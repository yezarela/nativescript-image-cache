import { Component } from '@angular/core';
import { initializeOnAngular } from 'nativescript-image-cache';

@Component({
  selector: 'ns-app',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor() {
    initializeOnAngular();
  }
}
