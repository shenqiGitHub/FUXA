import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, Output, EventEmitter, ElementRef } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, timer, empty, firstValueFrom } from 'rxjs';
import { takeUntil, switchMap, catchError, delay } from 'rxjs/operators';

import { HmiService } from '../../_services/hmi.service';
import { TranslateService } from '@ngx-translate/core';
import {AlarmExcelExport, AlarmPriorityType, AlarmQuery, AlarmStatusType} from '../../_models/alarm';
import { FormControl, FormGroup } from '@angular/forms';

import * as moment from 'moment';
import { ConfirmDialogComponent } from '../../gui-helpers/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {SettingsService} from '../../_services/settings.service';



@Component({
    selector: 'app-alarm-view',
    templateUrl: './alarm-view.component.html',
    styleUrls: ['./alarm-view.component.css']
})
export class AlarmViewComponent implements OnInit, AfterViewInit, OnDestroy {
    columns: ColumnConfig[] = [
        { headerKey: 'alarms.view-ontime', key: 'ontime', numFmt: 'yyyy.MM.dd HH:mm:ss' },
        { headerKey: 'alarms.view-text', key: 'text' },
        { headerKey: 'alarms.view-type', key: 'type' },
        { headerKey: 'alarms.view-group', key: 'group' },
        { headerKey: 'alarms.view-status', key: 'status' },
        { headerKey: 'alarms.view-offtime', key: 'offtime', numFmt: 'yyyy.MM.dd HH:mm:ss' },
        { headerKey: 'alarms.view-acktime', key: 'acktime', numFmt: 'yyyy.MM.dd HH:mm:ss' },
    ];


    alarmsColumns = ['ontime', 'text', 'type', 'group', 'status', 'ack', 'history'];
    historyColumns = ['ontime', 'text', 'type', 'group', 'status', 'offtime', 'acktime', 'userack', 'history'];
    displayColumns = this.alarmsColumns;

    showheader = false;
    currentShowMode = 'collapse';
    alarmsPolling: any;
    statusText = {};
    priorityText = {};
    alarmShowType = AlarmShowType;
    showType = AlarmShowType.alarms;
    history = [];
    alarmsLoading = false;
    dateRange: FormGroup;

    @Input() autostart = false;
    @Input() showInContainer = false;
    @Input() fullview = true;
    @Output() showMode: EventEmitter<string> = new EventEmitter();

    dataSource = new MatTableDataSource([]);
    @ViewChild(MatTable, {static: false}) table: MatTable<any>;
    @ViewChild(MatSort, {static: false}) sort: MatSort;
    @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

    private rxjsPollingTimer = timer(0, 2000);
    private destroy = new Subject<void>();

    constructor(private el: ElementRef,
                private translateService: TranslateService,
                private dialog: MatDialog,
                private settingsService: SettingsService,
                private hmiService: HmiService) {
        const today = moment();
        this.dateRange = new FormGroup({
            endDate: new FormControl(today.set({hour: 23, minute: 59, second: 59, millisecond: 999}).toDate()),
            startDate: new FormControl(today.set({hour: 0, minute: 0, second: 0, millisecond: 0}).add(-3, 'day').toDate())
        });
    }

    ngOnInit() {
        this.settingsService.onInitComplete.subscribe(() => {
            Object.keys(AlarmStatusType).forEach(key => {
                this.translateService.get(AlarmStatusType[key]).subscribe((txt: string) => { this.statusText[key] = txt; });
            });
            Object.keys(AlarmPriorityType).forEach(key => {
                this.translateService.get(AlarmPriorityType[key]).subscribe((txt: string) => { this.priorityText[key] = txt; });
            });
        });
    }

    ngAfterViewInit() {
        this.displayColumns = this.alarmsColumns;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.table.renderRows();
        if (this.autostart) {
            this.startAskAlarmsValues();
        }
    }

    ngOnDestroy() {
        this.stopAskAlarmsValues();
    }

    startAskAlarmsValues() {
        this.startPolling();
    }

    stopAskAlarmsValues() {
        this.stopPolling();
    }

    private stopPolling() {
        this.alarmsPolling = 0;
        this.destroy.next();
        this.destroy.complete();
    }

    private startPolling() {
        try {
            if (!this.alarmsPolling) {
                this.alarmsPolling = 1;
                this.destroy = new Subject();
                this.rxjsPollingTimer.pipe(takeUntil(this.destroy),
                    switchMap(() =>
                        this.hmiService.getAlarmsValues().pipe(
                            catchError((er) => this.handleError(er)))
                    )).subscribe(result => {
                        this.updateAlarmsList(result);
                    });
            }
        } catch (error) {
        }
    }

    private handleError(error: any) {
        return empty();
    }

    updateAlarmsList(alr: any[]) {
        if (this.showType === AlarmShowType.alarms) {
            alr.forEach(alr => {
                alr.status = this.getStatus(alr.status);
                alr.type = this.getPriority(alr.type);
            });
            this.dataSource.data = alr;
        }
    }

    getStatus(status: string) {
        return this.statusText[status];
    }

    getPriority(type: string) {
        return this.priorityText[type];
    }

    onAckAlarm(alarm: any) {
        this.hmiService.setAlarmAck(alarm.name).subscribe(result => {
        }, error => {
            console.error('Error setAlarmAck', error);
        });
    }

    onAckAllAlarm() {
        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                msg: this.translateService.instant('msg.alarm-ack-all')
            },
            position: {
                top: '60px'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.hmiService.setAlarmAck(null).subscribe(result => {
                }, error => {
                    console.error('Error onAckAllAlarm', error);
                });
            }
        });
    }

    onShowMode(mode: string) {
        this.currentShowMode = mode;
        this.showMode.emit(this.currentShowMode);
    }

    onClose() {
        this.currentShowMode = 'collapse';
        this.showMode.emit('close');
        this.stopAskAlarmsValues();
    }

    onShowAlarms() {
        this.showType = AlarmShowType.alarms;
        this.displayColumns = this.alarmsColumns;
    }

    onShowAlarmsHistory() {
        console.log(new Date(this.dateRange.value.startDate), new Date(this.dateRange.value.endDate));
        this.showType = AlarmShowType.history;
        this.displayColumns = this.historyColumns;
        let query: AlarmQuery = <AlarmQuery>{
            start: new Date(this.dateRange.value.startDate),
            end: new Date(this.dateRange.value.endDate)
        };
		this.alarmsLoading = true;
        this.hmiService.getAlarmsHistory(query).pipe(
            delay(1000)
        ).subscribe(result => {
            if (result) {
                result.forEach(alr => {
                    alr.status = this.getStatus(alr.status);
                    alr.type = this.getPriority(alr.type);
                });
                this.dataSource.data = result;
            }
		    this.alarmsLoading = false;
        });
    }

    async exportCurrentData() {
        let dicts = {status: this.statusText, type: this.priorityText};
        let sheetName;
        if(this.showType == AlarmShowType.history){
            sheetName = await firstValueFrom(this.translateService.get('alarms.view-title'));
        }else if(this.showType == AlarmShowType.alarms){
            sheetName = await firstValueFrom(this.translateService.get('alarms.history-title'));
        }
        this.getHeaderInfo().then(headerInfo =>{
            let query: AlarmExcelExport = <AlarmExcelExport>{
                start: new Date(this.dateRange.value.startDate),
                end: new Date(this.dateRange.value.endDate),
                sheetName: sheetName,
                type: this.showType,
                headerInfo: headerInfo,
                dicts: dicts
            };

            this.hmiService.getAlarmExcel(query).subscribe(res => {
                let blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' }) as any;
                const url = URL.createObjectURL(blob);
                const aLink = document.createElement('a');
                aLink.setAttribute('download', `${sheetName}.xlsx`);
                aLink.setAttribute('href', url);
                document.body.appendChild(aLink);
                aLink.click();
                document.body.removeChild(aLink);
                URL.revokeObjectURL(blob);
            }, error => {
                console.error('Download error!', error);
            });
        }).catch(err => console.error('Download error!', err));
    }

    async getHeaderInfo(){
        let relevantColumns = [];
        //history 这个字段不需要
        if(this.showType == AlarmShowType.history){
            relevantColumns = this.columns.filter(col => this.historyColumns.includes(col.key));
        }else if(this.showType == AlarmShowType.alarms){
            relevantColumns = this.columns.filter(col => this.alarmsColumns.includes(col.key));
        }

        const headers = await Promise.all(
            relevantColumns.map(async (column, index) => {
                    const width = this.getColumnWidth(`--column-${column.key}-width`);
                    this.getColumnWidth('--column-ontime-width');
                    const title = await firstValueFrom(this.translateService.get(column.headerKey));
                    return {
                        title,
                        dataIndex: column.key,
                        width: width,
                        numFmt: column.numFmt
                    };
                })
            );
        return headers;
    }

    getColumnWidth(varName: string) {
        const style = getComputedStyle(this.el.nativeElement);
        const columnOntimeWidth = style.getPropertyValue(varName).trim();
        return parseFloat(columnOntimeWidth);
    }
}

export enum AlarmShowType {
    alarms,
    history
}

interface ColumnConfig {
    headerKey: string; // 用于国际化的键
    key: string; // 对应数据的键
    numFmt?: string; // 日期格式
    cellStyle?: (element: any) => any; // 动态单元格样式
    cellContent?: (element: any) => any; // 动态内容处理
}
