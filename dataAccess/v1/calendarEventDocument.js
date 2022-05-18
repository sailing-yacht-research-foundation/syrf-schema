const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.CalendarEventDocument.create(data, {
    validate: true,
    transaction,
  });
};

exports.getAllDocumentByEvent = async (
  { calendarEventId, participantId },
  paging,
) => {
  let where = Object.assign(
    { calendarEventId },
    paging.query
      ? {
          documentName: {
            [db.Op.iLike]: `%${paging.query}%`,
          },
        }
      : {},
  );

  const result = await db.CalendarEventDocument.findAllWithPaging(
    {
      where,
      include: [
        {
          model: db.UserProfile,
          as: 'uploader',
          attributes: ['name', 'avatar'],
          required: true,
        },
        ...(participantId
          ? [
              {
                model: db.Participant,
                as: 'participants',
                through: {
                  attributes: ['createdAt'],
                },
                attributes: ['id', 'userProfileId'],
                required: false,
                where: {
                  id: participantId,
                },
              },
            ]
          : []),
      ],
    },
    paging,
  );
  return result;
};

exports.delete = async ({ id, calendarEventId }, transaction) => {
  const data = await db.CalendarEventDocument.findOne({
    where: {
      id,
      calendarEventId,
    },
  });

  if (data) {
    await db.CalendarEventDocument.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  return data?.toJSON();
};

exports.deleteAllDoc = async (calendarEventId, transaction) => {
  const documentsToDelete = await db.CalendarEventDocument.findAll({
    where: {
      calendarEventId,
    },
    attributes: ['id', 'documentUrl'],
    raw: true,
  });
  const deletedCount = await db.CalendarEventDocument.destroy({
    where: {
      calendarEventId,
    },
    transaction,
  });

  return {
    documentsToDelete,
    deletedCount,
  };
};

exports.getByDocumentIsSigned = async (
  documentId,
  calendarEventId,
  participantId,
) => {
  const result = await db.CalendarEventDocument.findOne({
    attributes: ['id', 'documentName', 'isRequired', 'documentUrl'],
    where: {
      id: documentId,
      calendarEventId,
    },
    include: [
      {
        model: db.Participant,
        as: 'participants',
        through: {
          attributes: ['createdAt'],
        },
        attributes: ['id', 'userProfileId'],
        required: false,
        where: {
          id: participantId,
        },
      },
    ],
  });
  return result?.toJSON();
};
