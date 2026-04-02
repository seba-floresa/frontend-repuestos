import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Vital para navegar

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.html',
})
export class App {}