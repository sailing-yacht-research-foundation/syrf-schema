const { weatherSubmodelToModel } = require('../../utils/utils');

describe('weatherSubmodelToModel', () => {
  it('should return the parent model of the weather models', async () => {
    expect(weatherSubmodelToModel('GFS_025_WIND_10M')).toEqual('GFS');
    expect(weatherSubmodelToModel('ERA5_025_PRES_SFC')).toEqual('ERA5');
    expect(weatherSubmodelToModel('ARPEGE_EUROPE')).toEqual('ARPEGE EUROPE');
  });
  it('should return UNKNOWN if no model can be found', async () => {
    expect(weatherSubmodelToModel('RANDOM')).toEqual('UNKNOWN');
    expect(weatherSubmodelToModel('TEST')).toEqual('UNKNOWN');
  });
});
