import { Transaction } from 'sequelize/types';
export interface EventGetAdminsByIdParams {
  includeAttributes: string[];
  transaction: Transaction;
}

export interface EventGetAllParams {
  position: [number, number];
  radius: number;
  userId: string;
  private: boolean;
}

export interface EventValidateAdminsByIdReturn {
  isOwner: boolean;
  isEditor: boolean;
  event: object;
}
export interface RelatedFile {
  type:
    | 'event_disclaimer'
    | 'media_waiver'
    | 'notice_of_race'
    | 'og_image'
    | 'vp_track_json'
    | 'vp_simplified_track_json'
    | 'vp_crew_track_json'
    | 'sliced_weather';
  path: string;
  bucket: 'opengraph_image' | 'individual_track' | 'sliced_weather';
  competitionUnitId?: string;
}
