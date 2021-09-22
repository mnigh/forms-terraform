const {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3Client = new S3Client({ region: process.env.REGION });

const reliabilityBucketName = "forms-staging-reliability-file-storage";
const vaultBucketName = "forms-staging-vault-file-storage";

async function retrieveFilesFromReliabilityStorage(filePaths) {
  try {
    let files = [];

    for (const filePath of filePaths) {
      console.log(`Filepath: ${filePath}`);
      const commandInput = {
        Bucket: reliabilityBucketName,
        Key: filePath,
      };

      const commandOutput = await s3Client.send(new GetObjectCommand(commandInput));

      files.push(commandOutput.Body);
    }

    return files;
  } catch (err) {
    console.error(err);
    throw new Error("I'm breaking again in retriveing files");
  }
}

async function copyFilesFromReliabilityToVaultStorage(filePaths) {
  for (const filePath of filePaths) {
    const commandInput = {
      Bucket: vaultBucketName,
      CopySource: `${reliabilityBucketName}/${filePath}`,
      Key: filePath,
    };

    await s3Client.send(new CopyObjectCommand(commandInput));
  }
}

async function removeFilesFromReliabilityStorage(filePaths) {
  for (const filePath of filePaths) {
    const commandInput = {
      Bucket: reliabilityBucketName,
      Key: filePath,
    };

    await s3Client.send(new DeleteObjectCommand(commandInput));
  }
}

module.exports = {
  retrieveFilesFromReliabilityStorage,
  copyFilesFromReliabilityToVaultStorage,
  removeFilesFromReliabilityStorage,
};
