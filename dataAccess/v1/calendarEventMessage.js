const db = require('../../index');

exports.create = async (data, transaction) => {
  return await db.CalendarEventMessage.create(data, {
    validate: true,
    transaction,
  });
};

exports.addRecipients = async (data, transaction) => {
  return await db.CalendarEventMessageRecipient.bulkCreate(data, {
    validate: true,
    transaction,
  });
};

exports.getAllMessageByEvent = async (calendarEventId) => {
  const messages = await db.CalendarEventMessage.findAll({
    attributes: ['id', 'senderId', 'messageContent', 'sentAt'],
    include: [
      {
        model: db.CalendarEventMessageRecipient,
        as: 'recipients',
        attributes: ['recipientId'],
        required: false,
        include: [
          {
            model: db.UserProfile,
            as: 'recipient',
            attributes: ['name', 'avatar'],
          },
        ],
      },
      {
        model: db.UserProfile,
        as: 'sender',
        attributes: ['name', 'avatar'],
        required: true,
      },
    ],
    where: {
      calendarEventId,
    },
    order: [['sentAt', 'DESC']],
  });

  return messages.map((row) => row.toJSON());
};
