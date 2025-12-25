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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  const postId = req.query.id
  
  try {
    // POST - Like a post
    if (req.method === 'POST' && req.url.includes('/like')) {
      const user = authenticateToken(req)
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id)
        
        // Decrement like count
        await supabase.rpc('decrement_likes', { post_id: postId })
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: postId }])
        
        // Increment like count
        await supabase.rpc('increment_likes', { post_id: postId })
      }
      
      return res.json({ success: true })
    }
    
    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Post API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}