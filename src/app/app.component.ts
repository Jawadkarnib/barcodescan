import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Barcode Scanner App';
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
  
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice!: MediaDeviceInfo;
  hasDevices = false;
  hasPermission = false;
  isScanning = false;
  errorMessage: string = '';

  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  ngOnInit() {
    this.initializeScanner();
  }

  ngOnDestroy() {
    this.stopScan();
  }

  private initializeScanner(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorMessage = 'Browser API not supported';
      return;
    }

    // Request camera permission explicitly
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        this.hasPermission = true;
      })
      .catch(error => {
        this.errorMessage = `Camera permission error: ${error.message}`;
        this.hasPermission = false;
      });
  }

  startScan(): void {
    if (!this.hasPermission) {
      this.errorMessage = 'Camera permission not granted';
      return;
    }

    this.isScanning = true;
    this.errorMessage = '';
    this.scannedResult = '';

    // Get and set the rear camera
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        this.availableDevices = videoDevices;
        this.hasDevices = videoDevices.length > 0;

        if (this.hasDevices) {
          // Try to find the rear camera
          const rearCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          ) || videoDevices[0];

          this.selectedDevice = rearCamera;
        } else {
          this.errorMessage = 'No cameras found';
        }
      })
      .catch(error => {
        this.errorMessage = `Error accessing cameras: ${error.message}`;
      });
  }

  stopScan(): void {
    this.isScanning = false;
  }

  onCodeResult(resultString: string) {
    this.scannedResult = resultString;
    // Optional: Stop scanning after successful scan
     this.stopScan();
    
    // Play a success sound
    const audio = new Audio('assets/beep.mp3');
    audio.play().catch(error => console.log('Audio play failed:', error));
  }

  handleError(error: any): void {
    this.errorMessage = `Scanner error: ${error}`;
    console.error('Scanner error:', error);
  }
}