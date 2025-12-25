import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

function authenticateToken(req) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) return null
  
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const user = authenticateToken(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get user profile with their posts
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        posts:posts(*)
      `)
      .eq('id', user.id)
      .single()
    
    if (profileError) throw profileError
    
    // Remove sensitive data
    delete profile.password_hash
    
    res.json({ success: true, data: profile })
    
  } catch (error) {
    console.error('Profile API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}