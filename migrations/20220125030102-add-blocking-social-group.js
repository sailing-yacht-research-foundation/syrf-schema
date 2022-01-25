'use strict';

const { followerStatus, groupMemberStatus } = require('../enums');

const socialEnumName = 'enum_UserFollowers_status';
const groupEnumName = 'enum_GroupMembers_status';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [socialEnum] = await queryInterface.sequelize.query(
        `SELECT enumlabel FROM pg_enum WHERE enumlabel = '${followerStatus.blocked}' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = '${socialEnumName}')`,
      );

      if (socialEnum.length < 1) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "${socialEnumName}" ADD VALUE '${followerStatus.blocked}'`,
          { transaction },
        );
      }

      const [groupEnum] = await queryInterface.sequelize.query(
        `SELECT enumlabel FROM pg_enum WHERE enumlabel = '${groupMemberStatus.blocked}' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = '${groupEnumName}')`,
      );

      if (groupEnum.length < 1) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "${groupEnumName}" ADD VALUE '${groupMemberStatus.blocked}'`,
          { transaction },
        );
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      queryInterface.sequelize.query(
        `DELETE FROM pg_enum WHERE enumlabel = '${followerStatus.blocked}' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = '${socialEnumName}')`,
        { transaction },
      );
      queryInterface.sequelize.query(
        `DELETE FROM pg_enum WHERE enumlabel = '${groupMemberStatus.blocked}' AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = '${groupEnumName}')`,
        { transaction },
      );
    });
  },
};
