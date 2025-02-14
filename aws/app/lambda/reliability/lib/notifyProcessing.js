const { NotifyClient } = require("notifications-node-client");
const convertMessage = require("markdown");
const { extractFileInputResponses, notifyProcessed } = require("dataLayer");
const { retrieveFilesFromReliabilityStorage } = require("s3FileInput");

module.exports = async (submissionID, sendReceipt, formSubmission, language, createdAt) => {
  try {
    // Making sure currently processed submission email address is defined
    if (
      !formSubmission.deliveryOption?.emailAddress ||
      formSubmission.deliveryOption.emailAddress === ""
    ) {
      throw Error("Email address is missing or empty.");
    }

    const fileInputPaths = extractFileInputResponses(formSubmission);
    const files = await retrieveFilesFromReliabilityStorage(fileInputPaths);
    const attachFileParameters = fileInputPaths.reduce((acc, current, index) => {
      return {
        [`file${index}`]: {
          file: files[index],
          filename: current.split("/").pop(), // Extract file name from storage path
          sending_method: "attach",
        },
        ...acc,
      };
    }, {});

    const templateID = process.env.TEMPLATE_ID;

    const notify = new NotifyClient(
      "https://api.notification.canada.ca",
      process.env.NOTIFY_API_KEY
    );

    const emailBody = convertMessage(formSubmission, submissionID, language, createdAt);
    const messageSubject =
      language === "fr"
        ? formSubmission.deliveryOption.emailSubjectFr
          ? formSubmission.deliveryOption.emailSubjectFr
          : formSubmission.form.titleFr
        : formSubmission.deliveryOption.emailSubjectEn
        ? formSubmission.deliveryOption.emailSubjectEn
        : formSubmission.form.titleEn;

    await notify.sendEmail(templateID, formSubmission.deliveryOption.emailAddress, {
      personalisation: {
        subject: messageSubject,
        formResponse: emailBody,
        ...attachFileParameters,
      },
      reference: submissionID,
    });

    await notifyProcessed(submissionID);

    console.log(
      JSON.stringify({
        level: "info",
        status: "success",
        submissionId: submissionID,
        sendReceipt: sendReceipt,
        msg: "Successfully sent submission through GC Notify.",
      })
    );
  } catch (error) {
    let errorMessage = "";

    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      const notifyErrors = Array.isArray(error.response.data.errors)
        ? JSON.stringify(error.response.data.errors)
        : error.response.data.errors;
      errorMessage = `GC Notify errored with status code ${error.response.status} and returned the following detailed errors ${notifyErrors}.`;
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      errorMessage = `${error.request}.`;
    } else {
      // Something else happened during processing
      errorMessage = `${error.message}.`;
    }

    console.error(
      JSON.stringify({
        level: "error",
        severity: 2,
        submissionId: submissionID ?? "n/a",
        sendReceipt: sendReceipt ?? "n/a",
        msg: "Failed to send submission through GC Notify",
        error: errorMessage,
      })
    );

    // Log full error to console, it will not be sent to Slack
    console.log(JSON.stringify(error));

    throw new Error(`Failed to send submission through GC Notify.`);
  }
};
