import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GaugeMonitorProperty } from '../../../../_models/hmi';


@Component({
  selector: 'app-monitor-property',
  templateUrl: './monitor-property.component.html',
  styleUrls: ['./monitor-property.component.css']
})
export class MonitorPropertyComponent implements OnInit {

  @Input() data: any;
  @Output() onPropChanged: EventEmitter<any> = new EventEmitter();
  @Input('reload') set reload(b: any) {
      this._reload();
  }

  property: GaugeMonitorProperty;

  constructor(private translateService: TranslateService) {
  }

  ngOnInit() {
      this._reload();
  }

  onPropertyChanged() {
      this.onPropChanged.emit(this.data.settings);
  }

  onTagChanged(variableId: string) {
      this.data.settings.property.variableId = variableId;
      this.onPropChanged.emit(this.data.settings);
  }

  private _reload() {
      if (!this.data.settings.property) {
          this.data.settings.property = <GaugeMonitorProperty>{ address: null, variableId: null };
      }
      this.property = this.data.settings.property;
  }

}
