const uuid = require('uuid');
const { faker } = require('@faker-js/faker');

const {
  getAll,
  getById,
  getByEmails,
  getByUserAndGroup,
  upsert,
  bulkCreate,
  delete: deleteMember,
  deleteByGroup,
  deleteByUserId,
  deleteStaleInvitation,
  getGroupsByUserId,
  getUsersByGroupId,
  getGroupAdmins,
  getGroupSize,
  getGroupMemberSummaries,
  getAllGroupsOfUser,
  update,
  addGroupMemberAsEditors,
  updateUserlessInvitations,
  getCurrentAcceptedMembers,
  getMembersById,
  getGroupsByUserWithoutPaging,
  getGroupMembersByUserIds,
} = require('../../dataAccess/v1/groupMember');

const db = require('../../index');
const { groupMemberStatus, groupVisibilities } = require('../../enums');

describe('Group Member DAL', () => {
  const defaultExpectedInclude = expect.arrayContaining([
    expect.objectContaining({
      model: db.Group,
      attributes: ['id', 'groupName', 'groupType', 'groupImage', 'visibility'],
    }),
    expect.objectContaining({
      model: db.UserProfile,
      attributes: ['id', 'name', 'email', 'avatar'],
    }),
  ]);
  const mockTransaction = db.sequelize.transaction();
  const mockAllPagingReturn = {
    count: 0,
    rows: [],
    page: 1,
    size: 10,
    sort: 'updatedAt',
    srdir: 'DESC',
    q: '',
    filters: [],
  };
  beforeAll(() => {
    db.GroupMember.findAllWithPaging.mockResolvedValue(mockAllPagingReturn);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getAll', () => {
    it('should findAllWithPaging on GroupMember of a group', async () => {
      const paging = { page: 1, size: 10 };
      const groupId = uuid.v4();

      const result = await getAll(paging, groupId);

      expect(result).toEqual(mockAllPagingReturn);
      expect(db.GroupMember.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            groupId,
          },
          include: expect.objectContaining({
            as: 'member',
            attributes: expect.arrayContaining(['id', 'name', 'avatar']),
          }),
        },
        paging,
      );
    });
    it('should have member name condition on where if provided in paging', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const groupId = uuid.v4();

      const result = await getAll(paging, groupId);

      expect(result).toEqual(mockAllPagingReturn);
      expect(db.GroupMember.findAllWithPaging).toHaveBeenCalledWith(
        {
          where: {
            groupId,
            ['$member.name$']: {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
          include: expect.objectContaining({
            as: 'member',
            attributes: expect.arrayContaining(['id', 'name', 'avatar']),
          }),
        },
        paging,
      );
    });
  });

  describe('getById', () => {
    it('should findByPk on group member by id', async () => {
      const groupMember = {
        id: uuid.v4(),
        groupId: uuid.v4(),
        userId: uuid.v4(),
        joinDate: new Date(),
        isAdmin: true,
        email: faker.internet.email(),
        status: groupMemberStatus.accepted,
        invitorId: null,
      };
      db.GroupMember.findByPk.mockResolvedValueOnce({
        toJSON: () => groupMember,
      });

      const result = await getById(groupMember.id);

      expect(result).toEqual(groupMember);
      expect(db.GroupMember.findByPk).toHaveBeenCalledWith(groupMember.id, {
        include: defaultExpectedInclude,
      });
    });
  });

  describe('getByEmails', () => {
    it('should findAll to GroupMember with email in the where condition', async () => {
      db.GroupMember.findAll.mockResolvedValueOnce([]);
      const groupId = uuid.v4();
      const emails = Array(2)
        .fill()
        .map(() => faker.internet.email());

      const result = await getByEmails(groupId, emails);

      expect(result).toEqual([]);
      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: {
          groupId,
          email: {
            [db.Op.in]: emails,
          },
        },
      });
    });
  });

  describe('getByUserAndGroup', () => {
    it('should findOne using userId and groupId in the where condition', async () => {
      const userId = uuid.v4();
      const groupId = uuid.v4();

      await getByUserAndGroup(userId, groupId);

      expect(db.GroupMember.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          groupId,
        },
        attributes: expect.arrayContaining([
          'id',
          'status',
          'joinDate',
          'isAdmin',
        ]),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'member',
            attributes: expect.arrayContaining(['id', 'name', 'email']),
          }),
        ]),
      });
    });
  });

  describe('upsert', () => {
    const data = {
      groupId: uuid.v4(),
      userId: uuid.v4(),
      joinDate: new Date(),
      isAdmin: true,
      email: faker.internet.email(),
      status: groupMemberStatus.accepted,
      invitorId: null,
    };
    beforeAll(() => {
      db.GroupMember.upsert.mockImplementation(async (detail, _transaction) => {
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
      db.GroupMember.upsert.mockReset();
    });
    it('should call upsert on GroupMember and create random uuid when not provided', async () => {
      const result = await upsert(undefined, data, mockTransaction);

      expect(result).toEqual({
        ...data,
        id: expect.any(String),
      });
      expect(db.GroupMember.upsert).toHaveBeenCalledWith(
        { ...data, id: expect.any(String) },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert on GroupMember and use provided uuid', async () => {
      const id = uuid.v4();

      const result = await upsert(id, data, mockTransaction);

      expect(result).toEqual({
        id,
        ...data,
      });
      expect(db.GroupMember.upsert).toHaveBeenCalledWith(
        { ...data, id },
        { transaction: mockTransaction },
      );
    });
    it('should call upsert & return successfully without optional parameters', async () => {
      const groupMemberId = uuid.v4();

      const result = await upsert(groupMemberId);

      expect(result).toEqual({ id: groupMemberId });
      expect(db.GroupMember.upsert).toHaveBeenCalledWith(
        { id: groupMemberId },
        undefined,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should call bulkCreate on GroupMember', async () => {
      const groupId = uuid.v4();
      const groupMembers = Array(3)
        .fill()
        .map(() => {
          return {
            groupId,
            userId: uuid.v4(),
            joinDate: new Date(),
            isAdmin: false,
            email: faker.internet.email(),
            status: groupMemberStatus.requested,
            invitorId: null,
          };
        });
      db.GroupMember.bulkCreate.mockResolvedValueOnce(groupMembers);

      const result = await bulkCreate(groupMembers, mockTransaction);

      expect(result).toEqual(groupMembers);
      expect(db.GroupMember.bulkCreate).toHaveBeenCalledWith(groupMembers, {
        updateOnDuplicate: ['status'],
        validate: true,
        transaction: mockTransaction,
      });
    });
    it('should not insert to DB when provided with empty array', async () => {
      const result = await bulkCreate([]);

      expect(result).toEqual([]);
      expect(db.GroupMember.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should find group member by id and destroy if found', async () => {
      const groupMember = {
        id: uuid.v4(),
        groupId: uuid.v4(),
        userId: uuid.v4(),
        joinDate: new Date(),
        isAdmin: true,
        email: faker.internet.email(),
        status: groupMemberStatus.accepted,
        invitorId: null,
      };
      db.GroupMember.findByPk.mockResolvedValueOnce({
        toJSON: () => groupMember,
      });

      const result = await deleteMember(groupMember.id, mockTransaction);

      expect(result).toEqual(groupMember);
      expect(db.GroupMember.destroy).toHaveBeenCalledWith({
        where: { id: groupMember.id },
        transaction: mockTransaction,
      });
    });
    it('should skip destroy if not found', async () => {
      db.GroupMember.findByPk.mockResolvedValueOnce(undefined);

      const result = await deleteMember(uuid.v4());

      expect(result).toEqual(undefined);
      expect(db.GroupMember.destroy).not.toHaveBeenCalled();
    });
  });

  describe('deleteByGroup', () => {
    it('should call destroy GroupMember with groupId as where condition', async () => {
      db.GroupMember.destroy.mockResolvedValueOnce(1);
      const groupId = uuid.v4();

      const result = await deleteByGroup(groupId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.GroupMember.destroy).toHaveBeenCalledWith({
        where: { groupId },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteByUserId', () => {
    it('should call destroy GroupMember with userId as where condition', async () => {
      db.GroupMember.destroy.mockResolvedValueOnce(1);
      const userId = uuid.v4();

      const result = await deleteByUserId(userId, mockTransaction);

      expect(result).toEqual(1);
      expect(db.GroupMember.destroy).toHaveBeenCalledWith({
        where: { userId },
        transaction: mockTransaction,
      });
    });
  });

  describe('deleteStaleInvitation', () => {
    it('should delete all invitations that exceeds certain threshold', async () => {
      db.GroupMember.destroy.mockResolvedValueOnce(10);

      const result = await deleteStaleInvitation(mockTransaction);

      expect(result).toEqual(10);
      expect(db.GroupMember.destroy).toHaveBeenCalledWith({
        where: {
          userId: { [db.Op.eq]: null },
          status: groupMemberStatus.invited,
          createdAt: {
            [db.Op.lt]: expect.any(String),
          },
        },
        transaction: mockTransaction,
      });
    });
  });

  describe('getGroupsByUserId', () => {
    it('should always have userId and status in the where condition', async () => {
      const paging = { page: 1, size: 10 };
      const userId = uuid.v4();
      const status = groupMemberStatus.requested;

      await getGroupsByUserId(paging, { userId, status });

      expect(db.GroupMember.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: {
            include: [
              [
                db.Sequelize.literal(
                  `(SELECT COUNT(*) FROM "GroupMembers" AS "member" WHERE "GroupMember"."groupId" = "member"."groupId" AND "status" = :status)`,
                ),
                'memberCount',
              ],
            ],
            exclude: expect.arrayContaining([
              'invitorId',
              'createdAt',
              'updatedAt',
              'groupId',
              'userId',
              'email',
            ]),
          },
          where: {
            userId,
            status,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'group',
              attributes: expect.arrayContaining([
                'id',
                'groupName',
                'groupImage',
                'groupType',
                'description',
                'visibility',
              ]),
            }),
          ]),
          replacements: {
            status: groupMemberStatus.accepted,
          },
        },
        paging,
      );
    });
    it('should add groupName in where condition if paging has query', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const userId = uuid.v4();
      const status = groupMemberStatus.requested;

      await getGroupsByUserId(paging, { userId, status });

      expect(db.GroupMember.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            status,
            '$group.groupName$': {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
        }),
        paging,
      );
    });
  });

  describe('getUsersByGroupId', () => {
    it('should always have groupId and status in the where condition', async () => {
      const paging = { page: 1, size: 10 };
      const groupId = uuid.v4();
      const status = groupMemberStatus.requested;

      await getUsersByGroupId(paging, { groupId, status });

      expect(db.GroupMember.findAllWithPaging).toHaveBeenCalledWith(
        {
          attributes: expect.arrayContaining([
            'id',
            'status',
            'joinDate',
            'isAdmin',
          ]),
          where: {
            groupId,
            status,
          },
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'member',
              attributes: expect.arrayContaining([
                'id',
                'name',
                'email',
                'avatar',
              ]),
            }),
          ]),
        },
        paging,
      );
    });
    it('should add member name in where condition if paging has query', async () => {
      const paging = { page: 1, size: 10, query: 'test' };
      const groupId = uuid.v4();
      const status = groupMemberStatus.requested;

      await getUsersByGroupId(paging, { groupId, status });

      expect(db.GroupMember.findAllWithPaging).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            groupId,
            status,
            '$member.name$': {
              [db.Op.iLike]: `%${paging.query}%`,
            },
          },
        }),
        paging,
      );
    });
  });

  describe('getGroupAdmins', () => {
    it('should call findAll on GroupMember and get the admins of the group', async () => {
      const groupId = uuid.v4();
      await getGroupAdmins(groupId);

      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: {
          groupId,
          status: groupMemberStatus.accepted,
          isAdmin: true,
        },
        attributes: expect.arrayContaining([
          'id',
          'userId',
          'isAdmin',
          'status',
        ]),
      });
    });
  });

  describe('getGroupSize', () => {
    it('should call count on GroupMember and return the number of members that are accepted', async () => {
      const groupId = uuid.v4();
      await getGroupSize(groupId);

      expect(db.GroupMember.count).toHaveBeenCalledWith({
        where: {
          groupId,
          status: groupMemberStatus.accepted,
        },
      });
    });
  });

  describe('getGroupMemberSummaries', () => {
    it('should perform a raw select query with replacements', async () => {
      const groupIds = [uuid.v4()];
      const numberOfMemberToFetch = 10;

      await getGroupMemberSummaries(groupIds, numberOfMemberToFetch);

      expect(db.sequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: {
            groupIds,
            status: groupMemberStatus.accepted,
            numberOfMemberToFetch,
          },
        }),
      );
    });
    it('should use default number of member if not provided', async () => {
      const groupIds = [uuid.v4()];

      await getGroupMemberSummaries(groupIds);

      expect(db.sequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: {
            groupIds,
            status: groupMemberStatus.accepted,
            numberOfMemberToFetch: 5,
          },
        }),
      );
    });
    it('should skip query and return empty array if not provided with any id', async () => {
      const result = await getGroupMemberSummaries([]);
      expect(result).toEqual([]);
      expect(db.sequelize.query).not.toHaveBeenCalled();
    });
  });

  describe('getAllGroupsOfUser', () => {
    it('should find all with raw query and no paging, groups of a certain user', async () => {
      const userId = uuid.v4();

      await getAllGroupsOfUser(userId);

      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: { userId },
        attributes: expect.arrayContaining([
          'id',
          'groupId',
          'status',
          'joinDate',
          'isAdmin',
        ]),
        raw: true,
      });
    });
  });

  describe('update', () => {
    it('should update group member data based on id, status, and userId', async () => {
      const id = uuid.v4();
      const userId = uuid.v4();
      const data = {
        joinDate: new Date(),
        isAdmin: false,
        email: faker.internet.email(),
        status: groupMemberStatus.accepted,
        invitorId: null,
      };
      db.GroupMember.update.mockResolvedValueOnce([1, undefined]);

      const result = await update(
        { id, userId, status: groupMemberStatus.accepted },
        data,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.GroupMember.update).toHaveBeenCalledWith(data, {
        where: { id, userId, status: groupMemberStatus.accepted },
        transaction: mockTransaction,
      });
    });
  });

  describe('addGroupMemberAsEditors', () => {
    it('should query for all accepted member of the group and bulkCreate CalendarEditor for all of them', async () => {
      const calendarEventId = uuid.v4();
      const groupId = uuid.v4();
      const members = Array(5)
        .fill()
        .map(() => {
          return {
            userId: uuid.v4(),
          };
        });
      const editors = members.map((row) => {
        return { UserProfileId: row.userId, CalendarEventId: calendarEventId };
      });

      db.GroupMember.findAll.mockResolvedValueOnce(members);
      db.CalendarEditor.bulkCreate.mockResolvedValueOnce(editors);

      const result = await addGroupMemberAsEditors(
        groupId,
        calendarEventId,
        mockTransaction,
      );

      expect(result).toEqual(editors);
      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: { groupId, status: groupMemberStatus.accepted },
        attributes: expect.arrayContaining(['userId']),
        raw: true,
      });
      expect(db.CalendarEditor.bulkCreate).toHaveBeenCalledWith(editors, {
        ignoreDuplicates: true,
        validate: true,
        transaction: mockTransaction,
      });
    });
  });

  describe('updateUserlessInvitations', () => {
    it('should update GroupMember where the userId is still null', async () => {
      const userId = uuid.v4();
      const email = faker.internet.email();
      db.GroupMember.update.mockResolvedValueOnce([1, undefined]);

      const result = await updateUserlessInvitations(
        userId,
        email,
        mockTransaction,
      );

      expect(result).toEqual(1);
      expect(db.GroupMember.update).toHaveBeenCalledWith(
        { userId },
        {
          where: expect.objectContaining({
            email,
            userId: { [db.Op.eq]: null },
          }),
          transaction: mockTransaction,
        },
      );
    });
  });

  describe('getCurrentAcceptedMembers', () => {
    it('should findAll GorupMember that are already accepted of provided group ids', async () => {
      const groupIds = [uuid.v4()];
      const members = Array(5)
        .fill()
        .map(() => {
          return { userId: uuid.v4() };
        });
      db.GroupMember.findAll.mockResolvedValueOnce(members);

      const result = await getCurrentAcceptedMembers(groupIds);

      expect(result).toEqual(members.map((row) => row.userId));
      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: {
          groupId: {
            [db.Op.in]: groupIds,
          },
          status: groupMemberStatus.accepted,
        },
        attributes: ['userId'],
        raw: true,
      });
    });
  });

  describe('getMembersById', () => {
    it('should return members of provided group id', async () => {
      const groupIds = [uuid.v4()];
      const members = Array(4)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            groupId: groupIds[0],
            status: groupMemberStatus.accepted,
            joinDate: new Date(),
            isAdmin: false,
            userId: uuid.v4(),
          };
        });
      db.GroupMember.findAll.mockResolvedValueOnce(
        members.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getMembersById(groupIds);

      expect(result).toEqual(members);
      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: {
          groupId: {
            [db.Op.in]: groupIds,
          },
          status: groupMemberStatus.accepted,
        },
        attributes: expect.arrayContaining([
          'id',
          'groupId',
          'status',
          'joinDate',
          'isAdmin',
          'userId',
        ]),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'member',
            attributes: expect.arrayContaining(['id', 'name', 'avatar']),
          }),
        ]),
      });
    });
    it('should modify group id into array if provided with non array', async () => {
      const groupId = uuid.v4();
      const members = Array(4)
        .fill()
        .map(() => {
          return {
            id: uuid.v4(),
            groupId,
            status: groupMemberStatus.accepted,
            joinDate: new Date(),
            isAdmin: false,
            userId: uuid.v4(),
          };
        });
      db.GroupMember.findAll.mockResolvedValueOnce(
        members.map((row) => {
          return { toJSON: () => row };
        }),
      );

      const result = await getMembersById(groupId);

      expect(result).toEqual(members);
      expect(db.GroupMember.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            groupId: {
              [db.Op.in]: [groupId],
            },
            status: groupMemberStatus.accepted,
          },
        }),
      );
    });
  });

  describe('getGroupsByUserWithoutPaging', () => {
    it('should findAll group member without paging', async () => {
      const userId = uuid.v4();
      const status = groupMemberStatus.requested;
      const groupQuery = {
        visibility: {
          [db.Op.in]: [groupVisibilities.public, groupVisibilities.moderated],
        },
      };

      await getGroupsByUserWithoutPaging({ userId, status, groupQuery });

      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: {
          userId,
          status,
        },
        attributes: {
          include: [
            [
              db.Sequelize.literal(
                `(SELECT COUNT(*) FROM "GroupMembers" AS "member" WHERE "GroupMember"."groupId" = "member"."groupId" AND "status" = :status)`,
              ),
              'memberCount',
            ],
          ],
          exclude: expect.arrayContaining([
            'invitorId',
            'createdAt',
            'updatedAt',
            'groupId',
            'userId',
            'email',
          ]),
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: 'group',
            attributes: expect.arrayContaining([
              'id',
              'groupName',
              'groupImage',
              'groupType',
              'description',
              'visibility',
            ]),
            where: groupQuery,
            required: true,
          }),
        ]),
        replacements: {
          status: groupMemberStatus.accepted,
        },
      });
    });
  });

  describe('getGroupMembersByUserIds', () => {
    it('should findAll GroupMember by bulk user ids', async () => {
      const userIds = Array(3)
        .fill()
        .map(() => uuid.v4());
      const groupId = uuid.v4();

      await getGroupMembersByUserIds(groupId, userIds);

      expect(db.GroupMember.findAll).toHaveBeenCalledWith({
        where: {
          groupId,
          userId: {
            [db.Op.in]: userIds,
          },
        },
        include: expect.objectContaining({ as: 'member' }),
      });
    });
  });
});
