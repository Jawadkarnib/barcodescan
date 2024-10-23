import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Barcode Scanner';
  scannedResult: string = '';
  allowedFormats = [ 
    BarcodeFormat.QR_CODE, 
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];
  
  currentDevice: MediaDeviceInfo | undefined;
  hasPermission = false;
  scannerActive = false;
  isProcessing = false;
  torchEnabled = false;
  scanFeedback = '';
  scanSuccess = false;
  scanningEnabled = false; // New flag to control barcode detection
  animationTimeout: any;
  previewEnabled = true; // New flag to control camera preview

  @ViewChild('scanner') scanner!: ZXingScannerComponent;
  errorMessage!: string;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeScanner();
  }

  ngOnDestroy() {
    this.stopScan();
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
  }

  private initializeScanner(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorMessage = 'Browser does not support accessing media devices';
      return;
    }

    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: window.innerWidth },
        height: { ideal: window.innerHeight }
      } 
    })
    .then(() => {
      this.hasPermission = true;
      this.selectCamera();
    })
    .catch(error => {
      console.error('Permission error:', error);
      this.errorMessage = `Camera permission denied. Please enable camera access and reload.`;
    });
  }

  private selectCamera(): void {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length > 0) {
          this.currentDevice = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          ) || videoDevices[0];
        }
        this.cd.detectChanges();
      });
  }

  startScan(): void {
    if (!this.hasPermission) {
      this.initializeScanner();
      return;
    }
    this.scannerActive = true;
    this.previewEnabled = true; // Enable camera preview
    this.scanningEnabled = false; // Don't start scanning yet
    this.scanSuccess = false;
    this.scanFeedback = 'Center the barcode and tap Scan';
    this.scannedResult = '';
    document.body.style.overflow = 'hidden';
    this.cd.detectChanges();
  }

  // Method to start actual barcode scanning
  triggerScan(): void {
    if (this.scanningEnabled) {
      // If already scanning, stop it
      this.scanningEnabled = false;
      this.scanFeedback = 'Center the barcode and tap Scan';
    } else {
      // Start scanning
      this.scanningEnabled = true;
      this.scanFeedback = 'Scanning...';
    }
    this.cd.detectChanges();
  }

  stopScan(): void {
    this.scannerActive = false;
    this.previewEnabled = false;
    this.scanningEnabled = false;
    this.scanSuccess = false;
    document.body.style.overflow = '';
    this.cd.detectChanges();
  }

  onCodeResult(resultString: string) {
    // Only process result if scanning is enabled
    if (!this.scanningEnabled || this.isProcessing) return;
    
    this.isProcessing = true;
    this.scanSuccess = true;
    this.scanFeedback = 'Barcode detected!';
    this.scannedResult = resultString;
    
    // Play success sound
    const audio = new Audio('assets/beep.mp3');
    audio.play().catch(error => console.log('Audio play failed:', error));
    
    // Show success animation and close scanner
    this.animationTimeout = setTimeout(() => {
      this.stopScan();
      this.isProcessing = false;
      this.cd.detectChanges();
    }, 1500);
  }

  handleError(error: any): void {
    if (!this.scanningEnabled) return; // Ignore errors when not actively scanning
    console.error('Scanner error:', error);
    this.scanFeedback = 'Scanner error. Please try again.';
    this.cd.detectChanges();
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }
}