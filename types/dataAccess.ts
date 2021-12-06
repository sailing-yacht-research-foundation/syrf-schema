export interface EventGetAdminsByIdParams {
  includeAttributes : string[]
}

export interface EventGetAllParams {
  position : [number, number];
  radius : number;
  userId : string;
  private : boolean;
}