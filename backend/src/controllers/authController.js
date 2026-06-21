const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../services/auditService');

const register = async (req, res) => {
  const { email, password, role, full_name } = req.body;

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    return errorResponse(res, 'User already exists', {}, 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const { data: user, error } = await supabase
    .from('users')
    .insert([{ email, password_hash: hashedPassword, role, full_name, is_active: true }])
    .select()
    .single();

  if (error) throw error;

  await logAudit({
    user_id: user.id,
    action: 'REGISTER',
    entity: 'users',
    entity_id: user.id,
  });

  return successResponse(res, { id: user.id, email: user.email, role: user.role, full_name: user.full_name }, 201);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return errorResponse(res, 'Invalid credentials', {}, 401);
  }

  if (user.is_active !== true) {
    return errorResponse(res, 'Account is not active', {}, 403);
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return errorResponse(res, 'Invalid credentials', {}, 401);
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  await logAudit({
    user_id: user.id,
    action: 'LOGIN',
    entity: 'users',
    entity_id: user.id,
  });

  return successResponse(res, {
    token,
    user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name }
  });
};

const getProfile = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, full_name, status')
    .eq('id', req.user.id)
    .single();

  if (error) throw error;

  return successResponse(res, { user });
};

module.exports = {
  register,
  login,
  getProfile,
};
