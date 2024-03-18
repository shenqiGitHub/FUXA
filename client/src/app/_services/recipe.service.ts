import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecipeDataCmdType } from '../_models/recipe';

import { EndPointApi } from '../_helpers/endpointapi';
import { Recipe } from '../_models/recipe';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Injectable()

export class RecipeService{
    private endPointConfig: string = EndPointApi.getURL();

    constructor(private http: HttpClient,
                private translateService: TranslateService,
                private toastr: ToastrService) {

    }
    getRecipes(): Observable<any> {
        let header = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.get<any>(this.endPointConfig + '/api/recipes', { headers: header});
    }


    getActiveRecipes(query: any): Observable<any> {
        let header = new HttpHeaders({ 'Content-Type': 'application/json' });
        const options = query ?
        { params: new HttpParams().set('deviceType', query) } : {};
        return this.http.get<any>(this.endPointConfig + '/api/activerecipes', options);
    }


    setOrUpdateRecipe(recipe: Recipe) {
            if (environment.serverEnabled) {
                let header = new HttpHeaders({ 'Content-Type': 'application/json' });
                let params = {cmd: RecipeDataCmdType.SetUpRecipe, data: recipe};
                this.http.post<any>(this.endPointConfig + '/api/recipe', params, { headers: header}).subscribe(result => {
                }, err => {
                    console.error(err);
                    this.notifySaveError();
                });
            } 
    }

    // setOrUpdateRecipe(recipe: Recipe) {
    //     return new Observable((observer) => {
    //         if (environment.serverEnabled) {
    //             let header = new HttpHeaders({ 'Content-Type': 'application/json' });
    //             let params = {cmd: RecipeDataCmdType.SetUpRecipe, data: recipe};
    //             this.http.post<any>(this.endPointConfig + '/api/recipe', params, { headers: header}).subscribe(result => {
    //                 observer.next();
    //             }, err => {
    //                 console.error(err);
    //                 this.notifySaveError();
    //                 observer.error(err);
    //             });
    //         } else {
    //             observer.next();
    //         }
    //     });
    // }


    removeRecipe(recipeId: String) {
            if (environment.serverEnabled) {
                let header = new HttpHeaders({ 'Content-Type': 'application/json' });
                let params = { cmd: RecipeDataCmdType.DelRecipe, data: recipeId };
                this.http.post<any>(this.endPointConfig + '/api/recipe', params, { headers: header}).subscribe(result => {
                }, err => {
                    console.error(err);
                    this.notifySaveError();
                });
            } 
    }

    // removeRecipe(recipeId: String) {
    //     return new Observable((observer) => {
    //         if (environment.serverEnabled) {
    //             let header = new HttpHeaders({ 'Content-Type': 'application/json' });
    //             let params = { cmd: RecipeDataCmdType.DelRecipe, data: recipeId };
    //             this.http.post<any>(this.endPointConfig + '/api/recipe', params, { headers: header}).subscribe(result => {
    //                 observer.next();
    //             }, err => {
    //                 console.error(err);
    //                 this.notifySaveError();
    //                 observer.error(err);
    //             });
    //         } else {
    //             observer.next();
    //         }
    //     });
    // }

    private notifySaveError() {
        let msg = '';
        this.translateService.get('msg.recipe-save-error').subscribe((txt: string) => { msg = txt; });
        this.toastr.error(msg, '', {
            timeOut: 3000,
            closeButton: true,
            disableTimeOut: true
        });
    }
}
