import { Component } from '@angular/core';
import { GaugeBaseComponent } from '../../gauge-base/gauge-base.component';
import { GaugeSettings, Variable } from '../../../_models/hmi';
import { Utils } from '../../../_helpers/utils';
import { GaugeDialogType } from '../../gauge-property/gauge-property.component';
import { ViewContainerRef } from '@angular/core';
import { MsePlayerComponent } from './mse-player/mse-player.component';


@Component({
  selector: 'app-html-monitor',
  templateUrl: './html-monitor.component.html',
  styleUrls: ['./html-monitor.component.css']
})
export class HtmlMonitorComponent{
  static TypeTag = 'svg-ext-own_ctrl-monitor';
  static LabelTag = 'HtmlMonitor';
  static prefixD = 'D-OXC_';

  constructor(private viewContainerRef: ViewContainerRef) {
      
  }

  static getSignals(pro: any) {
      let res: string[] = [];
      if (pro.variableId) {
          res.push(pro.variableId);
      }
      return res;
  }

  static getDialogType(): GaugeDialogType {
      return GaugeDialogType.Monitor;
  }

  static processValue(ga: GaugeSettings, svgele: any, sig: Variable) {
      try {
          // if (sig.value && svgele?.node?.children?.length >= 1) {
          //     const parentMonitor = Utils.searchTreeStartWith(svgele.node, this.prefixD);
          //     const monitor = parentMonitor.querySelector('video');
          //     const src = monitor.getAttribute('src');
          //     if (src !== sig.value && Utils.isValidUrl(sig.value)) {
          //         monitor.setAttribute('src', sig.value);
          //     }
          // }
      } catch (err) {
          console.error(err);
      }
  }

  static initElement(gab: GaugeSettings, viewContainerRef: ViewContainerRef) {
      let ele = document.getElementById(gab.id);
      if (ele) {
          ele?.setAttribute('data-name', gab.name);
          let svgMonitorContainer = Utils.searchTreeStartWith(ele, this.prefixD);
          if (svgMonitorContainer) {
              const componentRef = viewContainerRef.createComponent(MsePlayerComponent);

              svgMonitorContainer.innerHTML = '';

              (<MsePlayerComponent>componentRef.instance).id = gab.id;
              if(gab.property && gab.property.address){
                  (<MsePlayerComponent>componentRef.instance).mseUrl = gab.property.address;
              }

              componentRef.changeDetectorRef.detectChanges();
              svgMonitorContainer.appendChild(componentRef.location.nativeElement);

              componentRef.instance['myComRef'] = componentRef;
              componentRef.instance['name'] = gab.name;

              return componentRef.instance;
          }
      }
  }

  static detectChange(gab: GaugeSettings, res: any, ref: any): MsePlayerComponent {
      return HtmlMonitorComponent.initElement(gab, ref);
  }
}
