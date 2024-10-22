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
  isScanning = false;
  errorMessage: string = '';
  scannerActive = false;
  isProcessing = false;
  torchEnabled = false;
  scanFeedback = '';
  scanSuccess = false;
  animationTimeout: any;

  @ViewChild('scanner') scanner!: ZXingScannerComponent;

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
    this.isScanning = true;
    this.scanSuccess = false;
    this.scanFeedback = 'Position barcode in the center';
    this.scannedResult = '';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    this.cd.detectChanges();
  }

  stopScan(): void {
    this.scannerActive = false;
    this.isScanning = false;
    this.scanSuccess = false;
    document.body.style.overflow = ''; // Restore scrolling
    this.cd.detectChanges();
  }

  onCodeResult(resultString: string) {
    if (this.isProcessing) return; // Prevent multiple scans
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
    }, 1500); // Close after 1.5 seconds
  }

  handleError(error: any): void {
    console.error('Scanner error:', error);
    this.scanFeedback = 'Scanner error. Please try again.';
    this.cd.detectChanges();
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }
}