import { Component, ViewChild } from '@angular/core';
import { ZXingScannerComponent } from '@zxing/ngx-scanner'; // Import scanner component
import { BarcodeFormat } from '@zxing/library'; // Import BarcodeFormat

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Barcode Scanner App';
  scannedResult: string = '';
  allowedFormats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128]; // Allowed formats
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice!: MediaDeviceInfo;
  hasDevices = false;
  hasPermission = false;

  @ViewChild('scanner', { static: false }) scanner!: ZXingScannerComponent; // Reference to the scanner

  ngOnInit() {
    // Get available devices and check if we have camera permission
    this.scanner.camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
      this.availableDevices = devices;
      this.hasDevices = devices && devices.length > 0;
    });

    this.scanner.camerasNotFound.subscribe(() => {
      console.error('No cameras found.');
    });

    this.scanner.permissionResponse.subscribe((perm: boolean) => {
      this.hasPermission = perm;
    });
  }

  startScan() {
    if (this.availableDevices.length > 0) {
      // Try to find the rear camera (usually the last one in the list)
      const rearCamera = this.availableDevices.find(device => device.label.toLowerCase().includes('back')) || this.availableDevices[0];
      this.selectedDevice = rearCamera;
      this.scanner.device = this.selectedDevice; // Set the device for scanning
    }
  }

  onCodeResult(resultString: string) {
    this.scannedResult = resultString;
  }
}
