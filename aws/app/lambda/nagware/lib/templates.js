const { RDSDataClient, ExecuteStatementCommand } = require("@aws-sdk/client-rds-data");
const { Client } = require("pg");

async function getTemplateInfo(formID) {
  try {
    const { SQL, parameters } = createSQLString(formID);
    const requestResult = process.env.AWS_SAM_LOCAL ? requestSAM : requestRDS;
    const result = await requestResult(SQL, parameters);

    if (result) {
      return result;
    } else {
      throw new Error(`Could not find any template with form identifier: ${formID}.`);
    }
  } catch (error) {
    throw new Error(`Failed to retrieve template information. Reason: ${error.message}.`);
  }
}

const createSQLString = (formID) => {
  const selectSQL = `
  SELECT usr."name", usr."email", tem."name", tem."jsonConfig", tem."isPublished" 
  FROM "User" usr 
  JOIN "_TemplateToUser" ttu ON usr."id" = ttu."B" 
  JOIN "Template" tem ON tem."id" = ttu."A"
  `;
  if (!process.env.AWS_SAM_LOCAL) {
    return {
      SQL: `${selectSQL} WHERE ttu."A" = :formID`,
      parameters: [
        {
          name: "formID",
          value: {
            stringValue: formID,
          },
        },
      ],
    };
  } else {
    return {
      SQL: `${selectSQL} WHERE ttu."A" = $1`,
      parameters: [formID],
    };
  }
};

const parseQueryResponse = (records) => {
  if (records.length === 0) return null;

  let formName = "";

  const firstRecord = records[0];
  let isPublished = false;

  if (!process.env.AWS_SAM_LOCAL) {
    const jsonConfig = JSON.parse(firstRecord[3].stringValue.trim(1, -1)) || undefined;
    formName = firstRecord[2].stringValue !== "" ? firstRecord[2].stringValue : `${jsonConfig.titleEn} - ${jsonConfig.titleFr}`;
    isPublished = firstRecord[4].booleanValue;
  } else {
    formName = firstRecord.name !== "" ? firstRecord.name : `${firstRecord.jsonConfig.titleEn} - ${firstRecord.jsonConfig.titleFr}`;
    isPublished = firstRecord.isPublished;
  }

  const owners = records.map((record) => {
    if (!process.env.AWS_SAM_LOCAL) {
      return { name: record[0].stringValue, email: record[1].stringValue };
    } else {
      return { name: record.name, email: record.email };
    }
  });

  return { formName, owners, isPublished };
};

/**
 * Creates and processes request to LOCAL AWS SAM DB
 * @param {string} SQL
 * @param {string[]} parameters
 * @returns PG Client return value
 */
const requestSAM = async (SQL, parameters) => {
  // Placed outside of try block to be referenced in finally
  const dbClient = new Client();
  try {
    if (
      process.env.PGHOST &&
      process.env.PGUSER &&
      process.env.PGDATABASE &&
      process.env.PGPASSWORD
    ) {
      dbClient.connect();
    } else {
      throw new Error("Missing Environment Variables for DB config");
    }
    const data = await dbClient.query(SQL, parameters);
    return parseQueryResponse(data.rows);
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "error",
        error: error.message,
      })
    );
    // Lift more generic error to be able to capture event info higher in scope
    throw new Error("Error connecting to LOCAL AWS SAM DB");
  } finally {
    dbClient.end();
  }
};

/**
 * Creates and processes request to RDS
 * @param {string} SQL
 * @param {{name: string, value: {stringValue: string}[]}} parameters
 * @returns RDS client return value
 */
const requestRDS = async (SQL, parameters) => {
  try {
    const dbClient = new RDSDataClient({ region: process.env.REGION });
    const params = {
      database: process.env.DB_NAME,
      resourceArn: process.env.DB_ARN,
      secretArn: process.env.DB_SECRET,
      sql: SQL,
      includeResultMetadata: false, // set to true if we want metadata like column names
      parameters: parameters,
    };
    const command = new ExecuteStatementCommand(params);

    const data = await dbClient.send(command);
    return parseQueryResponse(data.records);
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "error",
        error: error.message,
      })
    );
    // Lift more generic error to be able to capture event info higher in scope
    throw new Error("Error connecting to RDS");
  }
};

module.exports = {
  getTemplateInfo,
};