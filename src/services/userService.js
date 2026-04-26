import * as userRepository from "../repository/userRepository.js";

export async function createUser(email, username, password, role) {
  // Validation
  if (!email || !username || !password || !role) {
    throw new Error("Missing required fields");
  }

  if (!["guest", "host"].includes(role)) {
    throw new Error("Role must be either guest or host");
  }

  // Check if email already exists
  const existingUser = await userRepository.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already in use");
  }

  // Business logic: in real app, hash the password here
  // const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  return await userRepository.createUser(email, username, password, role);
}

export async function getUserById(id) {
  if (!id) {
    throw new Error("User ID is required");
  }

  const user = await userRepository.getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getUserByEmail(email) {
  if (!email) {
    throw new Error("Email is required");
  }

  return await userRepository.getUserByEmail(email);
}

export async function getAllUsers(limit = 20, offset = 0) {
  if (limit < 1 || offset < 0) {
    throw new Error("Invalid pagination parameters");
  }

  return await userRepository.getAllUsers(limit, offset);
}

export async function updateUser(id, updates) {
  if (!id) {
    throw new Error("User ID is required");
  }

  const user = await userRepository.getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  // Validation: don't allow changing role directly (example business rule)
  if (updates.role && updates.role !== user.role) {
    throw new Error("Cannot change user role");
  }

  return await userRepository.updateUser(id, updates);
}

export async function deleteUser(id) {
  if (!id) {
    throw new Error("User ID is required");
  }

  const user = await userRepository.getUserById(id);
  if (!user) {
    throw new Error("User not found");
  }

  return await userRepository.deleteUser(id);
}
