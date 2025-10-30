import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Pet, ShopService, VaccineRecord, VaccineRecommendation } from '../../services/shop.service';

@Component({
  selector: 'app-vaccine-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vaccine-page.component.html',
  styleUrls: ['./vaccine-page.component.scss']
})
export class VaccinePageComponent implements OnInit {
  // --- Dashboard/Sidebar State ---
  sidebarCollapsed = false;
  activeExternalRoute = 'vaccines'; 

  // --- Vaccine Page State ---
  pets: Pet[] = [];
  selectedPet: Pet | null = null;
  vaccineRecords: VaccineRecord[] = [];
  recommendations: VaccineRecommendation[] = [];
  
  // Modal State
  showAddModal = false;
  newRecord: Partial<VaccineRecord> = {};
  
  // Timeline Data
  overdueCount = 0;
  dueSoonCount = 0;

  constructor(private shopService: ShopService, private router: Router) {}

  ngOnInit(): void {
    this.pets = this.shopService.getPets();
    if (this.pets.length > 0) {
      this.selectPet(this.pets[0].id);
    }
  }

  // --- Pet Selection & Data Loading ---
  selectPet(petId: string): void {
    if (!petId) return; // Ignore null/empty selection

    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;
    
    this.selectedPet = pet;
    this.loadPetData(pet);
  }

  loadPetData(pet: Pet): void {
    this.vaccineRecords = this.shopService.getVaccineRecords(pet.id);
    this.recommendations = this.shopService.getVaccineRecommendations(pet.type);
    this.updateTimelineSummary();
  }
  
  updateTimelineSummary(): void {
      const today = new Date().getTime();
      
      // Calculate Overdue (where nextDueDate has passed AND status is not 'Completed')
      this.overdueCount = this.vaccineRecords.filter(r => 
        new Date(r.nextDueDate).getTime() < today && 
        r.status !== 'Completed'
      ).length;
      
      // Calculate Due Soon: within the next 30 days
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const dueSoonDate = today + thirtyDays;

      this.dueSoonCount = this.vaccineRecords.filter(r => {
          const nextDate = new Date(r.nextDueDate).getTime();
          return nextDate > today && nextDate <= dueSoonDate && r.status !== 'Completed';
      }).length;
  }

  // --- Vaccine Management ---
  openAddRecordModal(): void {
    if (!this.selectedPet) {
      alert('Please select a pet first.');
      return;
    }
    // Initialize required fields for form binding
    this.newRecord = { 
        petId: this.selectedPet.id, 
        dateGiven: new Date(), 
        nextDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        vetName: 'Local Clinic' // Placeholder
    };
    this.showAddModal = true;
  }

  closeAddRecordModal(): void {
    this.showAddModal = false;
    this.newRecord = {};
  }

  saveVaccineRecord(isValid: boolean): void {
    if (isValid && this.newRecord.petId) {
      this.shopService.addVaccineRecord(this.newRecord as Omit<VaccineRecord, 'id'>);
      this.loadPetData(this.selectedPet!); // Reload data to update timeline
      this.closeAddRecordModal();
      alert('Vaccine record added successfully!');
    }
  }
  
  // --- Utility ---
  isOverdue(dueDate: Date): boolean {
      return new Date(dueDate).getTime() < new Date().getTime();
  }
  
  // --- Dashboard/Sidebar Methods (Required for layout) ---
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  navigateTo(route: string): void {
    if (route === 'logout') {
      this.router.navigate(['/home']);
      return;
    }
    this.router.navigate([`/${route}`]); 
  }
}
