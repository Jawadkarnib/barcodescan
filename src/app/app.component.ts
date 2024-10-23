import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

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
  scanningEnabled = false;
  animationTimeout: any;
  previewEnabled = true;

  // Define video constraints
  videoConstraints: MediaTrackConstraints = {
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
    facingMode: 'environment',
    aspectRatio: { ideal: 1.7777777778 }
  };

  // Define hints map
  hints = new Map<DecodeHintType, any>();

  @ViewChild('scanner') scanner!: ZXingScannerComponent;
  errorMessage!: string;

  constructor(private cd: ChangeDetectorRef) {
    // Initialize hints
    this.hints.set(DecodeHintType.TRY_HARDER, true);
    this.hints.set(DecodeHintType.POSSIBLE_FORMATS, this.allowedFormats);
    this.hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    this.hints.set(DecodeHintType.ASSUME_GS1, true);
    this.hints.set(DecodeHintType.PURE_BARCODE, false);
  }

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
      video: this.videoConstraints
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
          // Prefer high-resolution back camera
          this.currentDevice = videoDevices.find(device => {
            const label = device.label.toLowerCase();
            return (label.includes('back') || label.includes('rear')) &&
                   (label.includes('hd') || label.includes('high'));
          }) || videoDevices[0];
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
    this.scanFeedback = 'Position the barcode within the frame and tap Scan';
    this.scannedResult = '';
    
    document.body.style.overflow = 'hidden';
    this.cd.detectChanges();
  }

  triggerScan(): void {
    if (this.scanningEnabled) {
      this.scanningEnabled = false;
      this.scanFeedback = 'Position the barcode within the frame and tap Scan';
    } else {
      this.scanningEnabled = true;
      this.scanFeedback = 'Move camera closer or further as needed...';
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
    if (!this.scanningEnabled || this.isProcessing) return;
    
    this.isProcessing = true;
    this.scanSuccess = true;
    this.scanFeedback = 'Barcode detected!';
    this.scannedResult = resultString;
    
    const audio = new Audio('assets/beep.mp3');
    audio.play().catch(error => console.log('Audio play failed:', error));
    
    this.animationTimeout = setTimeout(() => {
      this.stopScan();
      this.isProcessing = false;
      this.cd.detectChanges();
    }, 1500);
  }

  handleError(error: any): void {
    if (!this.scanningEnabled) return;
    console.error('Scanner error:', error);
    this.scanFeedback = 'Adjust distance or angle and try again';
    this.cd.detectChanges();
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }
}