import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { EndPointApi } from '../_helpers/endpointapi';
import { ToastrService } from 'ngx-toastr';
import { AppSettings, DaqStore, SmtpSettings } from '../_models/settings';
import { EventEmitter } from '@angular/core';
import {firstValueFrom} from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    public onInitComplete: EventEmitter<void> = new EventEmitter();

    private appSettings = new AppSettings();
    private endPointConfig: string = EndPointApi.getURL();

    private editModeLocked = false;

    constructor(private http: HttpClient,
        private fuxaLanguage: TranslateService,
        private translateService: TranslateService,
        private toastr: ToastrService) {
    }

    async init() {
        this.fuxaLanguage.setDefaultLang('en');
        this.fuxaLanguage.use('en');

        if (environment.serverEnabled) {
            try {
                const result = await firstValueFrom(this.http.get<any>(this.endPointConfig + '/api/settings'));
                this.setSettings(result);
                // 设置完成后触发完成事件
                this.onInitComplete.emit();
            } catch (error) {
                console.error('settings.service err: ' + error);
            }
        }
        // 根据实际情况决定是否在此处调用
        // this.setLanguage(this.appSettings.language);
    }

    getSettings() {
        return this.appSettings;
    }

    setSettings(settings: AppSettings) {
        var dirty = false;
        if (settings.language && settings.language !== this.appSettings.language) {
            this.fuxaLanguage.use(settings.language);
            this.appSettings.language = settings.language;
            dirty = true;
        }
        if (settings.uiPort && settings.uiPort !== this.appSettings.uiPort) {
            this.appSettings.uiPort = settings.uiPort;
            dirty = true;
        }
        if (settings.secureEnabled !== this.appSettings.secureEnabled ||
            settings.tokenExpiresIn !== this.appSettings.tokenExpiresIn ||
            settings.secureOnlyEditor !== this.appSettings.secureOnlyEditor) {
            this.appSettings.secureEnabled = settings.secureEnabled;
            this.appSettings.tokenExpiresIn = settings.tokenExpiresIn;
            this.appSettings.secureOnlyEditor = settings.secureOnlyEditor;
            dirty = true;
        }
        if (settings.broadcastAll !== this.appSettings.broadcastAll) {
            this.appSettings.broadcastAll = settings.broadcastAll;
            dirty = true;
        }
        if (settings.smtp && !(settings.smtp.host === this.appSettings.smtp.host && settings.smtp.port === this.appSettings.smtp.port &&
                settings.smtp.mailsender === this.appSettings.smtp.mailsender && settings.smtp.username === this.appSettings.smtp.username &&
                settings.smtp.password === this.appSettings.smtp.password)) {
            this.appSettings.smtp = new SmtpSettings(settings.smtp);
            dirty = true;
        }
        if (settings.daqstore && !this.appSettings.daqstore.isEquals(settings.daqstore)) {
            this.appSettings.daqstore = new DaqStore(settings.daqstore);
            dirty = true;
        }
        if (settings.logFull !== this.appSettings.logFull) {
            this.appSettings.logFull = settings.logFull;
            dirty = true;
        }
        if (settings.alarms && settings.alarms.retention !== this.appSettings.alarms?.retention) {
            this.appSettings.alarms.retention = settings.alarms.retention ?? this.appSettings.alarms?.retention;
            dirty = true;
        }
        return dirty;
    }

    saveSettings() {
        if (environment.serverEnabled) {
            let header = new HttpHeaders({ 'Content-Type': 'application/json' });
            this.http.post<AppSettings>(this.endPointConfig + '/api/settings', this.appSettings, { headers: header }).subscribe(result => {
            }, err => {
                this.notifySaveError(err);
            });
        }
    }

    clearAlarms(all: boolean) {
        if (environment.serverEnabled) {
            let header = new HttpHeaders({ 'Content-Type': 'application/json' });
            this.http.post<any>(this.endPointConfig + '/api/alarmsClear', { headers: header, params: all }).subscribe(result => {
                var msg = '';
                this.translateService.get('msg.alarms-clear-success').subscribe((txt: string) => { msg = txt; });
                this.toastr.success(msg);
            }, err => {
                console.error(err);
                this.notifySaveError(err);
            });
        }
    }

    private notifySaveError(err: any) {
        let msg = '';
        this.translateService.get('msg.settings-save-error').subscribe((txt: string) => { msg = txt; });
        if (err.status === 401) {
            this.translateService.get('msg.settings-save-unauthorized').subscribe((txt: string) => { msg = txt; });
        }
        this.toastr.error(msg, '', {
            timeOut: 3000,
            closeButton: true,
            disableTimeOut: true
        });
    }

    //#region Editor Mode Check
    lockEditMode() {
        this.editModeLocked = true;
    }

    unlockEditMode() {
        this.editModeLocked = false;
    }

    isEditModeLocked(): boolean {
        return this.editModeLocked;
    }

    notifyEditorLocked() {
        var msg = '';
        this.translateService.get('msg.editor-mode-locked').subscribe((txt: string) => { msg = txt; });
        this.toastr.warning(msg, '', {
            timeOut: 3000,
            closeButton: true,
            disableTimeOut: false
        });
    }
    //#endregion
}
