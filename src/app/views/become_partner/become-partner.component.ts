import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators, AbstractControl, FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from "@angular/common";
import {SharedModule} from "../theme/shared/shared.module";
import {HttpHeaders} from "@angular/common/http";
import {Subject, takeUntil} from "rxjs";
import {ApiService} from "../../controllers/services/api.service";
import Swal from "sweetalert2";
import {AuthService} from "../../controllers/services/auth.service";

@Component({
  selector: 'app-become-partner',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
  ],
  templateUrl: './become-partner.component.html',
  styleUrls: ['./become-partner.component.scss']
})
export class BecomePartnerComponent implements OnInit {
  partnerForm: FormGroup;
  currentStep: number = 1;
  totalSteps: number = 2;
  isSubmitting: boolean = false;
  showSuccess: boolean = false;
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  isLoading: boolean = false;
  ownerExist: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
  ) {
    this.partnerForm = this.createForm();
  }

  ngOnInit(): void {
    this.updateProgressBar();
    this.partnerForm.get('ownerExist')?.valueChanges.subscribe((value) => {
      this.ownerExist = value;
      // this.partnerForm = this.createForm();
    });

  }

  createForm(): FormGroup {
    const commonFields = {
      ownerExist: [this.ownerExist],
      pharmacy_name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      pharmacy_address: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]],
      pharmacy_phone: ['', [
        Validators.required,
        Validators.pattern(/^\+33[0-9]{9}$/)
      ]],
      pharmacy_email: ['', [
        Validators.required,
        Validators.email
      ]],
      owner_email: ['', [
        Validators.required,
        Validators.email
      ]]
    };

    if (this.ownerExist) {
      return this.fb.group(commonFields);
    } else {
      return this.fb.group({
        ...commonFields,
        owner_full_name: ['', [
          Validators.required,
          this.fullNameValidator
        ]],
        owner_phone: ['', [
          Validators.required,
          Validators.pattern(/^\+33[0-9]{9}$/)
        ]],
      }, {
        validators: this.passwordMatchValidator
      });
    }
  }
  fullNameValidator(control: AbstractControl): {[key: string]: any} | null {
    // if (this.ownerExist) {return null;}
    if (control.value) {
      const words = control.value.trim().split(' ').filter((word: string) => word.length > 0);
      if (words.length < 2) {
        return { 'fullName': true };
      }
    }
    return null;
  }

  passwordValidator(control: AbstractControl): {[key: string]: any} | null {
    // if (this.ownerExist) {return null;}
    if (control.value) {
      const hasUpperCase = /[A-Z]/.test(control.value);
      const hasNumber = /\d/.test(control.value);
      if (!hasUpperCase || !hasNumber) {
        return { 'passwordStrength': true };
      }
    }
    return null;
  }

  passwordMatchValidator(form: AbstractControl): {[key: string]: any} | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirm_password');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  private handleError(message: string): void {
    Swal.fire({ //cybershieldds@gmail.com
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  async nextStep(): Promise<void> {
    if (this.validateCurrentStep()) {
      if (this.currentStep === 1) {
        const formData = {
          pharmacy_name: this.partnerForm.value.pharmacy_name,
          pharmacy_address: this.partnerForm.value.pharmacy_address,
          pharmacy_phone: this.partnerForm.value.pharmacy_phone,
          pharmacy_email: this.partnerForm.value.pharmacy_email,
        };
        try {
          this.isLoading =true;
          const headers = new HttpHeaders({
            // 'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          });

          this.apiService.post('pharmacies/check-pharmacy-info', {
            name: formData.pharmacy_name,
            address: formData.pharmacy_address,
            phone: formData.pharmacy_phone,
            email: formData.pharmacy_email,
            }, headers)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response: any) => {
                  if (response && !response.error) {
                    if (!response.exist) {
                      this.currentStep++;
                      this.updateProgressBar();
                    }else{
                      this.handleError(response.errorMessage ?? 'Un partenaire avec les informations entrees existe deja !');
                    }
                  } else {
                    this.handleError('Erreur lors de la communication avec le serveur');
                  }
                this.isLoading = false;
                },
              error: (error) => {
                this.handleError('Erreur lors de la communication avec le serveur');
                this.isLoading = false;
              }
            });
        } catch (error) {
          this.handleError('Une erreur s\'est produite. Veuillez reeassayez!');
          this.isLoading = false;
        }
      }else{
        this.currentStep++;
        this.updateProgressBar();
      }
    }
  }
  prevStep(): void {
    this.currentStep--;
    this.updateProgressBar();
  }
  updateProgressBar(): void {
    const progressElement = document.getElementById('progressFill');
    if (progressElement) {
      const progress = (this.currentStep / this.totalSteps) * 100;
      progressElement.style.width = progress + '%';
    }
  }
  validateCurrentStep(): boolean {
    const step1Fields = ['pharmacy_name', 'pharmacy_address', 'pharmacy_phone', 'pharmacy_email'];
    const step2Fields = ['owner_full_name', 'owner_email', 'owner_phone'];

    const fieldsToValidate = this.currentStep === 1 ? step1Fields : step2Fields;

    let isValid = true;
    fieldsToValidate.forEach(fieldName => {
      const control = this.partnerForm.get(fieldName);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });

    if (this.currentStep === 2 && this.partnerForm.hasError('passwordMismatch')) {
      isValid = false;
    }

    return isValid;
  }

  async onSubmit(): Promise<void> {
    var formData : any = {};
    var let_continue : boolean = false;
    var uid : string = "";
    if((!this.ownerExist && this.partnerForm.valid && this.validateCurrentStep()) || (this.ownerExist && this.isFieldValid('owner_email')) ) {
      formData.type_account = this.ownerExist ? 1 : 2;
      formData.email = this.partnerForm.value.owner_email;

      const fullFormData = {
        type_account: this.ownerExist ? 1 : 2,
        pharmacy_name: this.partnerForm.value.pharmacy_name,
        pharmacy_address: this.partnerForm.value.pharmacy_address,
        pharmacy_phone: this.partnerForm.value.pharmacy_phone,
        pharmacy_email: this.partnerForm.value.pharmacy_email,
        owner_full_name: this.partnerForm.value.owner_full_name,
        owner_email: this.partnerForm.value.owner_email,
        owner_phone: this.partnerForm.value.owner_phone,
      };

      try {
        this.isLoading =true;
        const headers = new HttpHeaders({
          // 'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });
        this.apiService.post('pharmacies/check-owner-and-save-info', fullFormData, headers)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: async (response: any) => {
              if (response){
                if (!response.continue || response.error) {
                  this.handleError(response.errorMessage ?? 'Erreur lors de la communication avec le serveur');
                } else {
                  Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: "Felicitations, la pharmacie a ete enregistree avec succes !" + (this.ownerExist ? "Vous pouvez retrouver la pharmacie dans votre tableau de bord" : " Pour vous connectez, vous devez consulter votre boite mail et confirmer votre adresse email pour creer votre mot de passe!")
                  });
                  this.router.navigate(['/login']);
                }
              } else {
                this.handleError('Erreur lors de la communication avec le serveur');
              }
              this.isLoading = false;
            },
            error: (error) => {
              this.handleError('Erreur lors de la communication avec le serveur');
              this.isLoading = false;
            }
          });
      } catch (error) {
        this.handleError('Une erreur s\'est produite. Veuillez reeassayez!');
        this.isLoading = false;
      }
    }else{this.handleError("Veuillez remplir tous les champs obligatoires !"); return;}

    formData.type_account = this.ownerExist ? 1 : 2;
    formData.email = this.partnerForm.value.owner_email;

  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else if (field === 'confirm_password') {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.partnerForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return 'Ce champ est obligatoire';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      if (control.errors['pattern']) {
        if (fieldName.includes('phone')) return 'Format requis: +33XXXXXXXXX';
        return 'Format invalide';
      }
      if (control.errors['email']) return 'Format email invalide';
      if (control.errors['fullName']) return 'Veuillez saisir le nom complet (minimum 2 mots)';
      if (control.errors['passwordStrength']) return 'Minimum 8 caractères, 1 majuscule et 1 chiffre';
    }

    if (fieldName === 'confirm_password' && this.partnerForm.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }

    return '';
  }

  isFieldValid(fieldName: string): boolean {
    const control = this.partnerForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.partnerForm.get(fieldName);
    if (fieldName === 'confirm_password' && this.partnerForm.hasError('passwordMismatch')) {
      return true;
    }
    return control ? control.invalid && control.touched : false;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  isStep1Valid(): boolean {
    const step1Fields = ['pharmacy_name', 'pharmacy_address', 'pharmacy_phone', 'pharmacy_email'];

    return step1Fields.every(fieldName => {
      const control = this.partnerForm.get(fieldName);
      return control && control.valid;
    });
  }

}
