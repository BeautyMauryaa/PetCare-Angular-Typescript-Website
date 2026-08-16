import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Address, ShopService, Vet, Pet } from '../../services/shop.service'; // Assuming Pet model is needed for the booking dropdown
import { MapComponent } from '../../components/map/map.component'; 
import { VetCardComponent } from '../../components/vet-card/vet-card.component'; 
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';

// --- New Data Models for Appointment Booking ---
interface AppointmentForm {
  petName: string;
  date: string; // datetime-local format: YYYY-MM-DDTHH:mm
  reason: string;
}

@Component({
  selector: 'app-vets-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent, VetCardComponent,ChatbotComponent], 
  templateUrl: './vets-page.component.html',
  styleUrls: ['./vets-page.component.scss']
})
export class VetsPageComponent implements OnInit {
  // --- Dashboard/Sidebar State ---
  sidebarCollapsed = false;
  activeExternalRoute = 'vets'; 

  // --- Vets Page State ---
  loading = true;
  vets: Vet[] = [];
  filteredVets: Vet[] = [];
  pets: Pet[] = []; // 🔑 Need pets array for the booking modal dropdown
  
  defaultAddress!: Address | undefined;
  currentLocationQuery = '';
  currentRadius = 5; 
  useGeolocation = false; 
  
  mapCenter = { lat: 28.7041, lng: 77.1025 }; // Default Delhi coordinates
  selectedVet: Vet | null = null;
  
  openNowFilter = false;
  minRating = 4;
  
  // 🔑 Appointment Booking Modal State
  showBookingModal = false;
  newAppointment: AppointmentForm = this.getInitialAppointmentForm();
  // End of Appointment Booking Modal State

  constructor(private shopService: ShopService, private router: Router) {}

  ngOnInit(): void {
    // 🔑 Load pets needed for the appointment form dropdown
    this.pets = this.shopService.getPets();
    if (this.pets.length > 0) {
        this.newAppointment.petName = this.pets[0].name;
    }
    
    this.loadVetsOnPageLoad();
  }

  // 🔑 Helper function for initial appointment form state
  getInitialAppointmentForm(): AppointmentForm {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getMinutes() % 15); // Round to nearest 15 min
      const formattedDateTime = now.toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
      
      return {
          petName: this.pets[0]?.name || '',
          date: formattedDateTime,
          reason: ''
      };
  }
  
  // --- Initial Loading ---
  async loadVetsOnPageLoad(): Promise<void> {
    this.loading = true;
    // 1. Fetch default address from service (using await for simulated backend fetch)
    this.defaultAddress = await this.shopService.getDefaultAddress();
    
    if (this.defaultAddress) {
      // Use Profile Address as starting location
      this.currentLocationQuery = `${this.defaultAddress.street}, ${this.defaultAddress.city}`;
      this.mapCenter = { lat: this.defaultAddress.latitude, lng: this.defaultAddress.longitude };
      await this.searchVetsByQuery(this.currentLocationQuery);
    } else {
      // Fallback to Geolocation if no profile address is set
      this.getUserCurrentLocation();
    }
  }
  
  // --- Geolocation (Current Location by Browser) ---
  getUserCurrentLocation(): void {
      this.loading = true;
      this.useGeolocation = true;
      this.currentLocationQuery = 'Fetching precise location...';

      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              // Success Callback
              (position) => {
                  this.mapCenter = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                  };
                  this.currentLocationQuery = 'Current Device Location (approx)';
                  // Search using the coordinates (real API scenario)
                  this.searchVetsByQuery(`Lat: ${this.mapCenter.lat}, Lng: ${this.mapCenter.lng}`); 
              },
              // Error Callback (Handles denial or failure to obtain fix)
              (error) => {
                  this.loading = false; 
                  this.useGeolocation = false; 
                  
                  let message = 'Location access denied or timed out.';
                  if (error.code === 2) {
                      message = 'Location signal unavailable (Error 2). Please use the search bar.';
                  }
                  
                  this.currentLocationQuery = 'Search required due to error: ' + message;
                  this.searchVetsByQuery('Delhi, India'); // Fallback search
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
      } else {
          this.loading = false;
          this.useGeolocation = false;
          this.currentLocationQuery = 'Geolocation Unsupported. Please use the search bar.';
          this.searchVetsByQuery('Delhi, India');
      }
  }
  
  // --- Search Logic (Manual Query or Geolocation Result) ---
  async searchVetsByQuery(query: string, radius: number = this.currentRadius): Promise<void> {
    this.loading = true;
    this.selectedVet = null;
    this.currentLocationQuery = query;
    
    // MOCK GEOCONDING LOGIC: Determine map center based on search query
    // In a real API call, the backend performs this geocoding. Here, we simulate the map center update.
    const mockCoords = this.getMockCoordsForQuery(query);
    this.mapCenter = mockCoords;

    // Call the service which performs the external Gemini/Places API call
    this.vets = await this.shopService.getVets(query, radius, mockCoords.lat, mockCoords.lng);
    this.applyFilters();
    
    this.loading = false; 
  }
  
  // Helper to trigger the query search from the input field
  triggerSearch(): void {
      this.searchVetsByQuery(this.currentLocationQuery, this.currentRadius);
  }

  // Helper to simulate Geocoding for specific Indian cities for map centering
  private getMockCoordsForQuery(query: string): { lat: number, lng: number } {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('patna')) {
        return { lat: 25.5941, lng: 85.1376 }; 
    } else if (queryLower.includes('jalandhar') || queryLower.includes('phagwara') || queryLower.includes('punjab')) {
        return { lat: 31.3260, lng: 75.5762 }; 
    } else if (queryLower.includes('delhi')) {
         return { lat: 28.7041, lng: 77.1025 }; 
    }
    // Default/Fallback
    return { lat: 19.0760, lng: 72.8777 }; 
  }

  // --- Filter/Interaction Logic ---
  applyFilters(): void {
    let tempVets = this.vets;

    tempVets = tempVets.filter(v => 
        (this.openNowFilter ? v.openNow : true) && 
        v.rating >= this.minRating
    );
    
    tempVets.sort((a, b) => a.distance - b.distance);

    this.filteredVets = tempVets;
  }

  selectVet(vet: Vet): void {
    this.selectedVet = vet;
  }
  
  viewVetDetails(vet: Vet): void {
      if (vet.website) {
          window.open(vet.website, '_blank');
      } else {
          // Using console.error instead of alert as per instructions
          console.error(`Vet website not available for ${vet.name}.`);
      }
  }
  
  recenterMap(): void {
      this.triggerSearch();
  }
  
  // --- Appointment Booking Methods ---
  openBookingModal(vet: Vet): void {
      if (this.pets.length === 0) {
          // In a real app, use a custom message box instead of alert
          console.error("Please add a pet to your profile before booking an appointment.");
          return;
      }
      this.selectedVet = vet;
      this.newAppointment = this.getInitialAppointmentForm();
      this.showBookingModal = true;
  }

  closeBookingModal(): void {
      this.showBookingModal = false;
      this.selectedVet = null;
  }

  submitAppointment(isValid: boolean): void {
      if (isValid && this.selectedVet) {
          console.log('Appointment confirmed:', {
              vet: this.selectedVet.name,
              ...this.newAppointment,
          });

          // Simulate confirmation without using alert()
          this.closeBookingModal();
          console.log(`Successfully booked appointment for ${this.newAppointment.petName} with ${this.selectedVet.name} on ${this.newAppointment.date}.`);
      }
  }

  // --- Dashboard/Sidebar Methods ---
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
