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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  try {
    // GET - Get all public posts
    if (req.method === 'GET') {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, full_name, avatar_url)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      return res.json({ success: true, data: posts || [] })
    }
    
    // POST - Create new post
    if (req.method === 'POST') {
      const user = authenticateToken(req)
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      const { image_url, title, description, category } = req.body
      
      if (!image_url) {
        return res.status(400).json({ error: 'Image URL is required' })
      }
      
      const { data: post, error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          image_url,
          title: title || 'Untitled',
          description,
          category: category || 'general',
          tags: []
        }])
        .select(`
          *,
          user:users(id, username, full_name, avatar_url)
        `)
        .single()
      
      if (error) throw error
      
      return res.json({ success: true, data: post })
    }
    
    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Posts API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}