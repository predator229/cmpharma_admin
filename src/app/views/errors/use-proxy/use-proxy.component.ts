// angular import
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-use-proxy',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './use-proxy.component.html',
  styleUrls: ['./use-proxy.component.scss']
})
export default class UseProxyComponent {

  goBack(): void {
    window.history.back();
  }

  contactSupport(): void {
    // Vous pouvez implémenter ici la logique pour ouvrir un formulaire de contact
    // ou rediriger vers une page de support
    window.location.href = '/contact-support';

    // Alternative: Ouvrir un mail pré-rempli
    // window.location.href = 'mailto:support@pharmacieconnectee.fr?subject=Problème d\'accès 305';
  }
}
