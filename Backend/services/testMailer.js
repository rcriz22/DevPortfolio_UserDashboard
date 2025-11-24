import { sendVerificationCodeEmail } from "./mailer.js"

sendVerificationCodeEmail("anyone@example.com", "Test Code", "123456")
  .then(() => console.log("Test complete"))
  .catch(console.error);
