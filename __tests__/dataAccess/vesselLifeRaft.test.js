const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  create,
  update,
  getAllByVessel,
  getById,
  delete: deleteLifeRaft,
} = require('../../dataAccess/v1/vesselLifeRaft');

const db = require('../../index');

describe('Vessel Life Raft', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should call create on VesselLifeRaft table', async () => {
      const data = {
        vesselId: uuid.v4(),
        serialNumber: faker.random.alphaNumeric(10),
      };
      const mockCreateReturn = {
        id: uuid.v4(),
        ...data,
      };
      db.VesselLifeRaft.create.mockResolvedValueOnce(mockCreateReturn);

      const result = await create(data, mockTransaction);

      expect(result).toEqual(mockCreateReturn);
      expect(db.VesselLifeRaft.create).toHaveBeenCalledWith(data, {
        validate: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('update', () => {
    it('should call update on VesselLifeRaft table', async () => {
      const data = {
        serialNumber: faker.random.alphaNumeric(10),
        capacity: faker.random.numeric(2),
      };
      const lifeRaftID = uuid.v4();
      db.VesselLifeRaft.update.mockResolvedValueOnce([
        1,
        [{ lifeRaftID, ...data }],
      ]);

      const result = await update(lifeRaftID, data, mockTransaction);

      expect(result).toEqual({
        updateCount: 1,
        updatedData: [{ lifeRaftID, ...data }],
      });
      expect(db.VesselLifeRaft.update).toHaveBeenCalledWith(data, {
        where: {
          id: lifeRaftID,
        },
        returning: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('getAllByVessel', () => {
    it('should call findAll to VesselLifeRaft and return the values', async () => {
      const vesselId = uuid.v4();
      const mockLifeRafts = [
        {
          id: uuid.v4(),
          serialNumber: faker.random.word(),
          capacity: faker.random.numeric(2),
          manufacturer: faker.random.word(),
          model: faker.random.word(),
          container: faker.random.word(),
          lastServiceDate: new Date(),
          manufactureDate: new Date(),
          ownership: faker.random.word(),
          verifyDate: new Date(),
          verifierUserId: uuid.v4(),
          vesselId,
        },
      ];
      db.VesselLifeRaft.findAll.mockResolvedValueOnce(mockLifeRafts);

      const result = await getAllByVessel(vesselId);

      expect(result).toEqual(mockLifeRafts);
      expect(db.VesselLifeRaft.findAll).toHaveBeenCalledWith({
        where: {
          vesselId,
        },
        attributes: expect.arrayContaining([
          'id',
          'serialNumber',
          'capacity',
          'manufacturer',
          'model',
          'container',
          'lastServiceDate',
          'manufactureDate',
          'ownership',
          'verifyDate',
          'verifierUserId',
        ]),
      });
    });
  });

  describe('getById', () => {
    it('should call findByPk to VesselLifeRaft and return the value', async () => {
      const mockLifeRaft = {
        id: uuid.v4(),
        serialNumber: faker.random.alphaNumeric(10),
        capacity: faker.random.numeric(2),
        vesselId: uuid.v4(),
      };
      db.VesselLifeRaft.findByPk.mockResolvedValueOnce({
        toJSON: () => mockLifeRaft,
      });

      const result = await getById(mockLifeRaft.id);

      expect(result).toEqual(mockLifeRaft);
      expect(db.VesselLifeRaft.findByPk).toHaveBeenCalledWith(mockLifeRaft.id);
    });
  });

  describe('delete', () => {
    it('should call destroy on VesselLifeRaft and return deleted count', async () => {
      const lifeRaftId = uuid.v4();
      db.VesselLifeRaft.destroy.mockResolvedValueOnce(1);

      const result = await deleteLifeRaft(lifeRaftId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.VesselLifeRaft.destroy).toHaveBeenCalledWith({
        where: {
          id: lifeRaftId,
        },
        transaction: mockTransaction,
      });
    });
  });
});
