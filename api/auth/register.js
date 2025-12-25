import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, username, full_name, password } = req.body

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        email,
        username,
        full_name,
        password_hash: passwordHash
      }])
      .select()
      .single()

    if (userError) throw userError

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove password hash from response
    delete user.password_hash

    res.status(201).json({
      success: true,
      token,
      user
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}