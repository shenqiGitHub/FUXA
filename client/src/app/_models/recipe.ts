import { RecipeDetailType, DeviceTypes } from './enum';

export class Recipe {
    recipeId: string;
    recipeName: string;
    deviceType: DeviceTypes;
    description: string;
    dbblockAddress: string;
    creationTime: number;
    version: number;
    isActive: number;
    detail: RecipeDetail[];
}



export class RecipeDetail {
    address: string;
    type: RecipeDetailType;
    value: string | number | boolean;
}

export enum RecipeDataCmdType{
    SetUpRecipe = 'set-up-recpie',
    DelRecipe = 'del-recipe',
}