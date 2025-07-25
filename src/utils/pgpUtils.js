import * as openpgp from 'openpgp';

/**
 * @desc Generates a PGP key pair on the client side.
 * @param {string} email - Email address for the key.
 * @param {string} passphrase - Passphrase to protect the private key.
 * @returns {Promise<{publicKeyArmored: string, privateKeyArmored: string}>}
 */
export const generatePGPKeyPair = async (email, passphrase) => {
  try {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 4096, // 4096 bits for strong encryption
      userIDs: [{ name: email, email: email }],
      passphrase: passphrase,
    });

    return {
      publicKeyArmored: publicKey,
      privateKeyArmored: privateKey,
    };
  } catch (error) {
    console.error('Error generating PGP key pair:', error);
    throw new Error('Failed to generate PGP key pair. Check console for details.');
  }
};

/**
 * @desc Encrypts a message using recipient's public key (client-side).
 * @param {string} message - The message to encrypt.
 * @param {string} publicKeyArmored - The recipient's armored public key.
 * @returns {Promise<string>} The encrypted message (armored).
 */
export const encryptMessage = async (message, publicKeyArmored) => {
  try {
    const publicKeys = await openpgp.readKeys({ armoredKeys: publicKeyArmored });
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: publicKeys,
    });
    return encrypted;
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Message encryption failed.');
  }
};

/**
 * @desc Decrypts an encrypted message using the user's private key and passphrase (client-side).
 * @param {string} encryptedMessageArmored - The armored encrypted message.
 * @param {string} privateKeyArmored - The user's armored private key.
 * @param {string} passphrase - The passphrase for the private key.
 * @returns {Promise<string>} The decrypted message.
 */
export const decryptMessage = async (encryptedMessageArmored, privateKeyArmored, passphrase) => {
  try {
    const privateKeys = await openpgp.readKeys({ armoredKeys: privateKeyArmored });

    const unlockedPrivateKey = await openpgp.decryptKey({
      privateKey: privateKeys[0],
      passphrase: passphrase,
    });

    const { data: decrypted } = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: encryptedMessageArmored }),
      decryptionKeys: unlockedPrivateKey,
      format: 'text'
    });

    return decrypted;
  } catch (error) {
    console.error('Error decrypting message:', error);
    if (error.message.includes('Invalid passphrase')) {
      throw new Error('Invalid passphrase. Please try again.');
    }
    throw new Error('Failed to decrypt message. Please check the passphrase and try again.');
  }
};