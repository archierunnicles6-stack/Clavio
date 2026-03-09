import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/linkedin?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/linkedin?error=no_code`)
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    // Get user profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const profileData = await profileResponse.json()

    // Get the current user from Supabase
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
    }

    // Store LinkedIn credentials in user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        linkedin_connected: true,
        linkedin_access_token: tokenData.access_token,
        linkedin_refresh_token: tokenData.refresh_token,
        linkedin_profile_id: profileData.id,
        linkedin_profile_data: profileData,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      throw new Error('Failed to save LinkedIn connection')
    }

    // Redirect to LinkedIn page with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/linkedin?success=true`)

  } catch (error) {
    console.error('LinkedIn callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/linkedin?error=connection_failed`)
  }
}
