import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialogRef } from '@angular/material/dialog';
import { AppService } from '../../_services/app.service';
import { Device, DeviceConnectionStatusType } from './../../_models/device';
import { Recipe } from '../../_models/recipe';
import { RecipeService } from '../../_services/recipe.service';



@Component({
  selector: 'app-recipe-upload',
  templateUrl: './recipe-upload.component.html',
  styleUrls: ['./recipe-upload.component.css']
})

export class RecipeUploadComponent implements OnInit, OnDestroy, AfterViewInit {

  private subscriptionPluginsChange: Subscription;

  deviceStatusType = DeviceConnectionStatusType;

  recipes: Recipe[];

  displayedColumns = ['recipeName','cloudUpload'];
  dataSource = new MatTableDataSource([]);

  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

  flowBorder = 5;
  flowWidth = 160;
  flowHeight = 70;
  flowLineHeight = 60;

  lineFlowSize = 6;
  lineFlowHeight = 60;
  lineDeviceSize = 6;
  mainHeight = 90;
  mainDeviceLineHeight = 60;
  mainBorder = 5;
  server: Device;
  devices = {};
  plugins = [];

  


  constructor(
                public dialogRef: MatDialogRef<RecipeUploadComponent>,
                // public data: any,
                private appService: AppService,
                private recipeService: RecipeService
                ) {
  }

  ngOnInit(): void {
    this.loadRecipes();
  }
    ngAfterViewInit() {
      if (this.appService.isClientApp) {
          this.mainDeviceLineHeight = 0;
          this.mainHeight = 0;
          this.flowLineHeight = 0;
          this.flowHeight = 0;
          this.lineFlowHeight = 0;
      }

      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    ngOnDestroy() {
      try {
          if (this.subscriptionPluginsChange) {
              this.subscriptionPluginsChange.unsubscribe();
          }
      } catch (e) {
      }
    }

    private loadRecipes() {
      this.recipes = [];
      let condition = new Recipe();
      this.recipeService.getRecipes(condition).subscribe(result => {
        Object.values<Recipe>(result).forEach(
          r => {
           this.recipes.push(r);
        });
        this.bindToTable(this.recipes);
      }, err => {
        console.error('get Users err: ' + err);
      });
    }

    onclickUpload(recipe : Recipe){
      console.info(recipe);
    }


    public upload(recipe: Recipe){
      recipe.detail;
    }

    onNoClick(): void {
      this.dialogRef.close();
    }

    private bindToTable(recipes) {
      this.dataSource.data = recipes;
    }
}