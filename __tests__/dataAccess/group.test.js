const { faker } = require('@faker-js/faker');
const uuid = require('uuid');

const {
  getAll,
  getById,
  getByIds,
  upsert,
  update,
  delete: deleteGroup,
  bulkDelete,
  addGroupAsAdmin,
  removeGroupFromAdmin,
  getUserGroupsForInput,
  getByStripeConnectedAccount,
  getValidOrganizerGroup,
} = require('../../dataAccess/v1/group');
const {
  groupVisibilities,
  groupMemberStatus,
  groupTypes,
} = require('../../enums');

const db = require('../../index');

describe('Group DAL', () => {
  const mockTransaction = db.sequelize.transaction();
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getAll', () => {
    it('should findAllWithPaging on Group', async () => {
      const paging = { page: 1, size: 10, query: '' };
      const params = {
        visibilities: [groupVisibilities.moderated, groupVisibilities.private],
        userId: uuid.v4(),
      };
      await getAll(paging, params);

      expect(db.Group.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'groupMember',
              attributes: expect.arrayContaining(['status', 'isAdmin']),
              required: false,
              where: {
                userId: params.userId,
              },
            }),
          ]),
          where: {
            visibility: {
              [db.Op.in]: params.visibilities,
            },
          },
          subQuery: false,
        }),
        paging,
      );
    });
    it('should findAllWithPaging on Group excluding blocked user and query by groupName', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const params = {
        visibilities: [groupVisibilities.moderated, groupVisibilities.private],
        userId: uuid.v4(),
        excludeBlocked: true,
      };
      await getAll(paging, params);

      expect(db.Group.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'groupMember',
              attributes: expect.arrayContaining(['status', 'isAdmin']),
              required: false,
              where: {
                userId: params.userId,
              },
            }),
          ]),
          where: {
            visibility: {
              [db.Op.in]: params.visibilities,
            },
            groupName: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
            [db.Op.or]: [
              {
                '$groupMember.status$': {
                  [db.Op.ne]: groupMemberStatus.blocked,
                },
              },
              {
                '$groupMember.status$': {
                  [db.Op.is]: null,
                },
              },
            ],
          },
          subQuery: false,
        }),
        paging,
      );
    });
  });

  describe('getById', () => {
    it('should findByPk on Group and return JSON value', async () => {
      const groupDetail = {
        id: uuid.v4(),
        groupName: faker.name.findName(),
      };
      db.Group.findByPk.mockResolvedValueOnce({ toJSON: () => groupDetail });

      const result = await getById(groupDetail.id);

      expect(result).toEqual(groupDetail);
      expect(db.Group.findByPk).toHaveBeenCalledWith(groupDetail.id);
    });
  });

  describe('getByIds', () => {
    it('should findAll Group that are specified in params', async () => {
      const groupIds = Array(5)
        .fill()
        .map(() => uuid.v4());
      const mockGroupReturns = groupIds.map((row) => {
        return {
          id: row,
          groupName: `Group ${faker.name.findName()}`,
        };
      });
      db.Group.findAll.mockResolvedValueOnce(mockGroupReturns);
      const attributes = ['id', 'groupName'];
      const result = await getByIds(groupIds, attributes);

      expect(result).toEqual(mockGroupReturns);
      expect(db.Group.findAll).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: groupIds,
          },
        },
        attributes,
        raw: true,
      });
    });
    it('should skip query to DB if not provided with ids', async () => {
      const result = await getByIds(undefined, ['id']);

      expect(result).toEqual([]);
      expect(db.Group.findAll).not.toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    beforeAll(() => {
      db.Group.upsert.mockImplementation(async (detail, _transaction) => {
        return [
          {
            toJSON: () => {
              return { ...detail };
            },
          },
          true,
        ];
      });
    });
    afterAll(() => {
      db.Group.upsert.mockReset();
    });
    it('should generate random id if not provided', async () => {
      const data = {
        groupName: `Group ${faker.name.findName()}`,
      };

      const result = await upsert(undefined, data, mockTransaction);

      expect(result).toEqual({
        id: expect.any(String),
        ...data,
      });
      expect(db.Group.upsert).toHaveBeenCalledWith(
        { id: expect.any(String), ...data },
        { transaction: mockTransaction },
      );
    });
    it('should use provided id and set undefined options if not provided with transaction', async () => {
      const data = {
        groupName: `Group ${faker.name.findName()}`,
      };
      const id = uuid.v4();

      const result = await upsert(id, data);

      expect(result).toEqual({
        id,
        ...data,
      });
      expect(db.Group.upsert).toHaveBeenCalledWith({ id, ...data }, undefined);
    });
    it('should upsert & return successfully without optional parameters', async () => {
      const id = uuid.v4();

      const result = await upsert(id);

      expect(result).toEqual({ id });
      expect(db.Group.upsert).toHaveBeenCalledWith({ id }, undefined);
    });
  });

  describe('update', () => {
    it('should call update on Group', async () => {
      const id = uuid.v4();
      const data = { groupName: `Group ${faker.name.findName()}` };
      db.Group.update.mockResolvedValueOnce([1, undefined]);

      const result = await update(id, data, mockTransaction);

      expect(result).toEqual(1);
      expect(db.Group.update).toHaveBeenCalledWith(data, {
        where: { id },
        transaction: mockTransaction,
      });
    });
  });

  describe('delete', () => {
    it('should find group and destroy group & editor if found', async () => {
      const groupData = {
        id: uuid.v4(),
        groupName: `Group ${faker.name.findName()}`,
      };
      db.Group.findByPk.mockResolvedValueOnce({ toJSON: () => groupData });

      const result = await deleteGroup(groupData.id, mockTransaction);

      expect(result).toEqual(groupData);
      expect(db.Group.destroy).toHaveBeenCalledWith({
        where: {
          id: groupData.id,
        },
        transaction: mockTransaction,
      });
      expect(db.CalendarGroupEditor.destroy).toHaveBeenCalledWith({
        where: {
          groupId: groupData.id,
        },
        transaction: mockTransaction,
      });
      expect(db.VesselGroupEditor.destroy).toHaveBeenCalledWith({
        where: {
          groupId: groupData.id,
        },
        transaction: mockTransaction,
      });
    });
    it('should skip destroy if group not found', async () => {
      db.Group.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteGroup(uuid.v4(), mockTransaction);

      expect(result).toEqual(undefined);
      expect(db.Group.destroy).not.toHaveBeenCalled();
      expect(db.CalendarGroupEditor.destroy).not.toHaveBeenCalled();
    });
  });

  describe('bulkDelete', () => {
    it('should destroy Group specified in the parameters', async () => {
      const idList = Array(5)
        .fill()
        .map(() => uuid.v4());
      db.Group.destroy.mockResolvedValueOnce(1);

      const result = await bulkDelete(idList, mockTransaction);

      expect(result).toEqual(1);
      expect(db.Group.destroy).toHaveBeenCalledWith({
        where: {
          id: {
            [db.Op.in]: idList,
          },
        },
        transaction: mockTransaction,
      });
      expect(db.CalendarGroupEditor.destroy).toHaveBeenCalledWith({
        where: {
          groupId: {
            [db.Op.in]: idList,
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('addGroupAsAdmin', () => {
    it('should add group to calendarGroupEditor', async () => {
      const groupId = uuid.v4();
      const calendarEventId = uuid.v4();

      await addGroupAsAdmin(groupId, calendarEventId, mockTransaction);

      expect(db.CalendarGroupEditor.create).toHaveBeenCalledWith(
        {
          groupId,
          calendarEventId,
        },
        { transaction: mockTransaction },
      );
    });
  });

  describe('removeGroupFromAdmin', () => {
    it('should destroy CalendarGroupEditor record', async () => {
      const groupId = uuid.v4();
      const calendarEventId = uuid.v4();

      await removeGroupFromAdmin(groupId, calendarEventId, mockTransaction);

      expect(db.CalendarGroupEditor.destroy).toHaveBeenCalledWith({
        where: {
          groupId,
          calendarEventId,
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getUserGroupsForInput', () => {
    it('should findAllWithPaging on Private and Moderated Groups', async () => {
      const paging = { page: 1, size: 10, query: '' };
      const userId = uuid.v4();
      await getUserGroupsForInput(paging, userId);

      expect(db.Group.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'groupMember',
              attributes: expect.arrayContaining(['status', 'isAdmin']),
              required: true,
              where: {
                userId,
                status: groupMemberStatus.accepted,
              },
            }),
          ]),
          where: {
            visibility: {
              [db.Op.in]: [
                groupVisibilities.private,
                groupVisibilities.moderated,
              ],
            },
          },
        }),
        paging,
      );
    });
    it('should query by groupName', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const userId = uuid.v4();
      await getUserGroupsForInput(paging, userId);

      expect(db.Group.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'groupMember',
              attributes: expect.arrayContaining(['status', 'isAdmin']),
              required: true,
              where: {
                userId,
                status: groupMemberStatus.accepted,
              },
            }),
          ]),
          where: {
            visibility: {
              [db.Op.in]: [
                groupVisibilities.private,
                groupVisibilities.moderated,
              ],
            },
            groupName: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
        }),
        paging,
      );
    });
  });

  describe('getByStripeConnectedAccount', () => {
    it('should findOne using provided stripeConnectedAccountId', async () => {
      const stripeConnectedAccountId = `acct_${faker.random.alphaNumeric(10)}`;
      const data = {
        id: uuid.v4(),
        groupName: faker.name.findName(),
        stripeConnectedAccountId,
      };
      db.Group.findOne.mockResolvedValueOnce({ toJSON: () => data });

      const result = await getByStripeConnectedAccount(
        stripeConnectedAccountId,
      );

      expect(result).toEqual(data);
      expect(db.Group.findOne).toHaveBeenCalledWith({
        where: {
          stripeConnectedAccountId,
        },
      });
    });
  });

  describe('getValidOrganizerGroup', () => {
    it('should findAll group that are of organization type and has requesting user as accepted member', async () => {
      const userId = uuid.v4();
      await getValidOrganizerGroup(userId);

      expect(db.Group.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            groupType: groupTypes.organization,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'groupMember',
              attributes: expect.arrayContaining(['status', 'isAdmin']),
              required: true,
              where: {
                userId,
                status: groupMemberStatus.accepted,
              },
            }),
          ]),
        }),
      );
    });
  });
});
