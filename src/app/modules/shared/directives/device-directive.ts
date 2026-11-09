import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

@Directive({
  selector: '[appDevice]',
  standalone: true
})
export class DeviceDirective {

  private deviceInfo = {
    isTablet: false,
    isMobile: false,
    isDesktop: true
  };

  private currentDevice: DeviceType | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input()
  set appDevice(device: DeviceType) {
    this.currentDevice = device;
    this.updateView();
  }

  @Input()
  set appDeviceDeviceInfo(info: {
    isTablet: boolean;
    isMobile: boolean;
    isDesktop: boolean;
  }) {
    this.deviceInfo = info;
    this.updateView();
  }

  private updateView(): void {
    if (!this.currentDevice) return;

    const visible = {
      mobile: this.deviceInfo.isMobile,
      tablet: this.deviceInfo.isTablet,
      desktop: this.deviceInfo.isDesktop
    }[this.currentDevice];

    this.viewContainer.clear();

    if (visible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}