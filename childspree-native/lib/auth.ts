import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const TENANT_ID = '3d9cf274-547e-4af5-8dde-01a636e0b607';
const CLIENT_ID = 'ddf5d2a5-b2f2-4661-943f-c25fcc69833f';

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
};

export function useMicrosoftAuth() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'msauth.org.fosterlabs.childspree',
    path: 'auth',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      prompt: AuthSession.Prompt.SelectAccount,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<AuthSession.TokenResponse> {
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code,
      redirectUri,
      extraParams: {
        code_verifier: '',
      },
    },
    discovery
  );
  return tokenResult;
}

export async function getMicrosoftUserInfo(accessToken: string) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export async function storeAuthToken(token: string) {
  await SecureStore.setItemAsync('auth_token', token);
}

export async function getAuthToken() {
  return SecureStore.getItemAsync('auth_token');
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync('auth_token');
}

export async function storeUser(user: {
  displayName: string;
  mail: string;
  role: string;
}) {
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));
}

export async function getStoredUser() {
  const data = await SecureStore.getItemAsync('user_data');
  if (!data) return null;
  return JSON.parse(data);
}

export async function clearUser() {
  await SecureStore.deleteItemAsync('user_data');
}
