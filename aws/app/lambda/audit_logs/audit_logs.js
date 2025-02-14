const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");

const warnOnEvents = [
  // Form Events
  "GrantFormAccess",
  "RevokeFormAccess",
  // User Events
  "UserActivated",
  "UserDeactivated",
  "UserTooManyFailedAttempts",
  "GrantPrivilege",
  "RevokePrivilege",
  // Application events
  "EnableFlag",
  "DisableFlag",
  "ChangeSetting",
  "CreateSetting",
  "DeleteSetting",
];

const notifyOnEvent = async (logEvents) => {
  const eventsToNotify = logEvents.filter((logEvent) => warnOnEvents.includes(logEvent.event));
  eventsToNotify.forEach((logEvent) =>
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: `User ${logEvent.userID} performed ${logEvent.event} on ${logEvent.subject?.type} ${
          logEvent.subject.id ?? `with id ${logEvent.subject.id}.`
        }${logEvent.description ? "\n".concat(logEvent.description) : ""}`,
      })
    )
  );
};

exports.handler = async function (event) {
  /* 
  LogEvent contains:
  {
    userID,
    event,
    timestamp,
    subject: {type, id?},
    description,
  }
  */
  try {
    const logEvents = event.Records.map((record) => ({
      messageId: record.messageId,
      logEvent: JSON.parse(record.body),
    }));

    // Warn on events that should be notified
    await notifyOnEvent(logEvents.map((event) => event.logEvent));

    // Archive after 1 year
    const archiveDate = ((d) => Math.floor(d.setFullYear(d.getFullYear() + 1) / 1000))(new Date());

    const putTransactionItems = logEvents.map(({ logEvent }) => ({
      PutRequest: {
        Item: {
          UserID: logEvent.userID,
          "Event#SubjectID#TimeStamp": `${logEvent.event}#${
            logEvent.subject.id ?? logEvent.subject.type
          }#${logEvent.timestamp}`,
          Event: logEvent.event,
          Subject: `${logEvent.subject.type}${
            logEvent.subject.id ? `#${logEvent.subject.id}` : ""
          }`,
          TimeStamp: logEvent.timestamp,
          ...(logEvent.description && { Description: logEvent.description }),
          ArchiveDate: archiveDate,
        },
      },
    }));

    const dynamoDb = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.REGION ?? "ca-central-1",
        ...(process.env.AWS_SAM_LOCAL && { endpoint: "http://host.docker.internal:4566" }),
      })
    );

    const {
      UnprocessedItems: { AuditLogs },
    } = await dynamoDb.send(
      new BatchWriteCommand({
        RequestItems: {
          AuditLogs: putTransactionItems,
        },
      })
    );

    if (typeof AuditLogs !== "undefined") {
      const unprocessedIDs = AuditLogs.map(({ PutItem: { UserID, Event, TimeStamp } }, index) => {
        // Find the original LogEvent item that has the messageID
        const [unprocessItem] = logEvents.filter(
          ({ logEvent }) =>
            logEvent.userID === UserID &&
            logEvent.event === Event &&
            logEvent.timestamp === TimeStamp
        )[0];

        if (!unprocessItem)
          throw new Error(
            `Unprocessed LogEvent could not be found. ${JSON.stringify(
              AuditLogs[index]
            )} not found.`
          );

        return unprocessItem.messageId;
      });

      console.warn(
        JSON.stringify({
          level: "warn",
          severity: 1,
          msg: `Failed to process ${
            unprocessedIDs.length
          } log events. List of unprocessed IDs: ${unprocessedIDs.join(",")}.`,
        })
      );

      return {
        batchItemFailures: unprocessedIDs.map((id) => ({ itemIdentifier: id })),
      };
    }

    return {
      batchItemFailures: [],
    };
  } catch (error) {
    // Catastrophic Error - Fail whole batch -- Error Message will be sent to slack
    console.error(
      JSON.stringify({
        level: "error",
        severity: 1,
        msg: "Failed to run Audit Logs Processor.",
        error: error.message,
      })
    );

    return {
      batchItemFailures: event.Records.map((record) => ({ itemIdentifier: record.messageId })),
    };
  }
};
