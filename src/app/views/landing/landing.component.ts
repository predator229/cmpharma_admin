// angular import
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  message: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface HeroData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export default class LandingComponent implements OnInit {
  // Hero section data

  userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');

  heroData: HeroData = {
    title: 'La livraison de médicaments simplifiée',
    subtitle: 'Commandez vos médicaments en ligne et recevez-les à domicile en quelques heures.',
    ctaText: 'Créer un compte',
    ctaLink: '/register'
  };

  // Features section data
  features: Feature[] = [
    {
      icon: 'ti ti-clock',
      title: 'Livraison rapide',
      description: 'Recevez vos médicaments en moins de 2 heures à votre domicile.'
    },
    {
      icon: 'ti ti-shield-check',
      title: 'Sécurité garantie',
      description: 'Toutes vos données sont cryptées et vos paiements 100% sécurisés.'
    },
    {
      icon: 'ti ti-device-mobile',
      title: 'Application mobile',
      description: 'Suivez vos commandes en temps réel depuis notre application.'
    },
    {
      icon: 'ti ti-receipt',
      title: 'Ordonnances digitales',
      description: 'Envoyez vos ordonnances directement via notre plateforme.'
    },
    {
      icon: 'ti ti-map-pin',
      title: 'Couverture étendue',
      description: 'Service disponible dans plus de 200 villes en France.'
    },
    {
      icon: 'ti ti-24-hours',
      title: 'Support 24/7',
      description: 'Une équipe à votre écoute pour répondre à toutes vos questions.'
    }
  ];

  // Screenshots carousel
  screenshots: string[] = [
    'assets/images/screenshots/screen-1.png',
    'assets/images/screenshots/screen-2.png',
    'assets/images/screenshots/screen-3.png',
    'assets/images/screenshots/screen-4.png',
    'assets/images/screenshots/screen-5.png'
  ];

  // Testimonials section data
    testimonials: Testimonial[] = [
      {
        name: 'Marie Dubois',
        role: 'Cliente',
        message: 'Un service exceptionnel ! J\'ai reçu mes médicaments en moins d\'une heure. Je recommande vivement cette application à tous ceux qui ont besoin de médicaments rapidement.'
      },
      {
        name: 'Pierre Martin',
        role: 'Pharmacien',
        message: 'cmPharma nous a permis d\'augmenter notre chiffre d\'affaires de 30% en seulement trois mois. La plateforme est intuitive et facile à utiliser.'
      },
      {
        name: 'Sophie Lefèvre',
        role: 'Cliente',
        message: 'Je suis une personne à mobilité réduite et cette application a changé ma vie. Je peux maintenant recevoir mes médicaments sans avoir à me déplacer.'
      },
      {
        name: 'Thomas Moreau',
        role: 'Livreur',
        message: 'Travailler avec cmPharma me permet de gérer mon emploi du temps comme je le souhaite tout en gagnant un revenu complémentaire.'
      }
    ];

  // FAQ section data
  faqs: FAQ[] = [
    {
      question: 'Comment fonctionne la livraison de médicaments ?',
      answer: 'Vous commandez vos médicaments via notre application ou site web, une pharmacie partenaire prépare votre commande, puis un livreur vous l\'apporte directement à domicile en moins de 2 heures.'
    },
    {
      question: 'Puis-je envoyer mon ordonnance via l\'application ?',
      answer: 'Oui, vous pouvez prendre en photo votre ordonnance ou la télécharger directement sur notre plateforme. Elle sera traitée en toute sécurité par nos pharmacies partenaires.'
    },
    {
      question: 'Quels modes de paiement sont acceptés ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, ainsi que le paiement par tiers-payant pour les médicaments remboursés si vous avez enregistré votre carte Vitale.'
    },
    {
      question: 'Dans quelles villes êtes-vous disponibles ?',
      answer: 'Notre service est actuellement disponible dans plus de 200 villes en France, principalement dans les grandes agglomérations. Vous pouvez vérifier la disponibilité dans votre zone en entrant votre code postal sur notre application.'
    },
    {
      question: 'Comment devenir pharmacie partenaire ?',
      answer: 'Pour devenir pharmacie partenaire, rendez-vous dans la section "Partenaires" de notre site et remplissez le formulaire d\'inscription. Notre équipe vous contactera sous 48h pour finaliser votre intégration.'
    },
    {
      question: 'Comment devenir livreur ?',
      answer: 'Pour rejoindre notre réseau de livreurs, téléchargez notre application dédiée "cmPharma Livreurs", créez votre profil et soumettez les documents nécessaires. Après validation, vous pourrez commencer à effectuer des livraisons.'
    }
  ];

  ngOnInit(): void {
    this.initTabsNavigation();
    this.initFaqAccordion();
    this.initMobileNavToggle();
  }

  onLoginClick(): void {
    // Utilisation de Router sera nécessaire si vous souhaitez naviguer par programmation
    // this.router.navigate(['/login']);

    // Alternative avec RouterLink dans le template HTML
    window.location.href = '/login';
  }

  // Initialize tabs navigation
  private initTabsNavigation(): void {
    document.addEventListener('DOMContentLoaded', () => {
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          const tabId = target.getAttribute('data-tab');

          // Remove active class from all buttons and panes
          document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
          document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));

          // Add active class to current button and pane
          target.classList.add('active');
          document.getElementById(tabId!)?.classList.add('active');
        });
      });
    });
  }

  // Initialize FAQ accordion
  private initFaqAccordion(): void {
    document.addEventListener('DOMContentLoaded', () => {
      const faqQuestions = document.querySelectorAll('.faq-question');
      faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
          const isExpanded = question.getAttribute('data-expanded') === 'true';
          const answer = question.nextElementSibling as HTMLElement;

          // Toggle the current FAQ item
          question.setAttribute('data-expanded', isExpanded ? 'false' : 'true');
          answer.style.display = isExpanded ? 'none' : 'block';
        });
      });
    });
  }

  // Initialize mobile navigation toggle
  private initMobileNavToggle(): void {
    document.addEventListener('DOMContentLoaded', () => {
      const navbarToggle = document.querySelector('.navbar-toggle');
      const navbarMenu = document.querySelector('.navbar-menu');

      navbarToggle?.addEventListener('click', () => {
        navbarToggle.classList.toggle('active');
        navbarMenu?.classList.toggle('active');
      });
    });
  }
}
