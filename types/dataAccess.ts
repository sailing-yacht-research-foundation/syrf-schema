export interface EventGetAdminsByIdParams {
  includeAttributes : string[]
}

export interface EventGetAllParams {
  position : [number, number];
  radius : number;
  userId : string;
  private : boolean;
}

export interface EventValidateAdminsByIdReturn {
  isOwner: boolean;
  isEditor: boolean;
  event: object;
}