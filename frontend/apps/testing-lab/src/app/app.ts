import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toasts } from './ui/toasts';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts],
  selector: 'lab-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly nav = [
    { label: 'Aufgaben', link: '/aufgaben' },
    { label: 'Statistik', link: '/statistik' },
    { label: 'Komponenten', link: '/komponenten' },
    { label: 'Kontakte', link: '/kontakte' },
  ];
}
