const { NotifyClient } = require("notifications-node-client");

const notifyClient = new NotifyClient(
  "https://api.notification.canada.ca",
  process.env.NOTIFY_API_KEY
);

async function notifyFormOwner(formID, formName, formOwnerEmailAddress) {
  try {
    const baseUrl = `http://${process.env.DOMAIN}`;

    await notifyClient.sendEmail(process.env.TEMPLATE_ID, formOwnerEmailAddress, {
      personalisation: {
        subject: "Overdue form responses - Réponses de formulaire non traitées",
        formResponse: `
**GC Forms Notification**

Form name: ${formName}

There are form responses over 28 days old. Form responses must be downloaded and confirmed within 5 days.

Downloading of responses will be restricted if unconfirmed responses are older than 35 days

After 45 days, if responses remain unconfirmed, an incident process will kick-off.

[Download and confirm form responses now](${baseUrl}/form-builder/responses/${formID})

****

**Notification de Formulaires GC**

Nom du formulaire: ${formName}

De nouvelles réponses ont plus de 28 jours de retard. Les réponses au formulaire doivent être téléchargées et confirmées dans les 5 jours.

Le téléchargement des réponses sera limité si les réponses non confirmées datent de plus de 35 jours

Si les réponses ne sont toujours pas confirmées après 45 jours, un processus d'incident sera déclaré.

[Télécharger et confirmer les réponses au formulaire maintenant](${baseUrl}/fr/form-builder/responses/${formID})`,
      },
    });
  } catch (error) {
    if (process.env.ENVIRONMENT === "staging") {
      if (error.response?.data?.errors) {
        if (
          error.response.data.errors.find((e) =>
            e.message.includes("Can’t send to this recipient using a team-only API key")
          ) !== undefined
        )
          return;
      }
    }
    // Error Message will be sent to slack
    console.error(
      JSON.stringify({
        level: "error",
        msg: `Failed to send nagware email to form owner: ${formOwnerEmailAddress} for form ID ${formID} .`,
        error: error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message,
      })
    );
    // Continue to send nagware emails even if one fails
    return;
  }
}

module.exports = {
  notifyFormOwner,
};
