import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID,
      allowGuestAccess: true,
      identityPoolRegion: process.env.NEXT_PUBLIC_AWS_REGION,
    },
  },
});