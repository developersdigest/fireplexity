# WorkOS Configuration Guide

This document outlines the required WorkOS Dashboard configuration for the Fireplexity application.

## Required Dashboard Configuration

### 1. Redirect URIs
In your WorkOS Dashboard, navigate to your project settings and configure the following in the "Redirects" section:

**Development:**
- **Redirect URI**: `http://localhost:3000/api/auth/callback`
- **Logout redirect URI**: `http://localhost:3000`

**Production:**
- **Redirect URI**: `https://your-domain.com/api/auth/callback`
- **Logout redirect URI**: `https://your-domain.com`

### 2. Environment Variables
Ensure your `.env.local` file contains:

```bash
# WorkOS Configuration
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
WORKOS_COOKIE_PASSWORD=your_32_character_hex_password
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# App URL (should match logout redirect URI)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Issues

### Sign-out Error: "app-homepage-url-not-found"
This error occurs when the "Logout redirect URI" is not configured in the WorkOS Dashboard. 

**Solution:** Configure the logout redirect URI in your WorkOS Dashboard to match your `NEXT_PUBLIC_APP_URL`.

### Authentication Flow
The application uses WorkOS AuthKit with the following endpoints:
- Sign-in: `/api/auth/signin` - Redirects to WorkOS AuthKit
- Callback: `/api/auth/callback` - Handles WorkOS authentication response
- Sign-out: `/api/auth/signout` - Ends session and redirects to homepage

## Testing Authentication
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign In" and complete the WorkOS authentication flow
4. Once authenticated, click "Sign Out" to test the logout flow
5. Verify you're redirected to the homepage without errors

## Production Deployment
When deploying to production:
1. Update the WorkOS Dashboard redirect URIs to use your production domain
2. Update environment variables to use production values
3. Ensure `NEXT_PUBLIC_APP_URL` matches your production domain
