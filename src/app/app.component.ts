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
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR
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
  scannerConstraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 },
      aspectRatio: { ideal: 1.7777777778 },
      focusMode: 'continuous'
    }
  };
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
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        aspectRatio: { ideal: 1.7777777778 },
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
    this.previewEnabled = true;
    this.scanningEnabled = false;
    this.scanSuccess = false;
    this.scanFeedback = 'Position the entire barcode within the scanning area';
    this.scannedResult = '';
    document.body.style.overflow = 'hidden';
    this.cd.detectChanges();
  }

  triggerScan(): void {
    if (this.scanningEnabled) {
      this.scanningEnabled = false;
      this.scanFeedback = 'Position the entire barcode within the scanning area';
    } else {
      this.scanningEnabled = true;
      this.scanFeedback = 'Scanning large barcode...';
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