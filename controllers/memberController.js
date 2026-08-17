const pool = require('../config/db');

// GET /api/projects/:projectId/members — list members (must be a member)
async function getMembers(req, res) {
  const { projectId } = req.params;

  try {
    const membership = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.user_id]
    );

    if (membership.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pool.query(
      `SELECT u.user_id, u.username, u.email, pm.role
       FROM project_members pm
       JOIN users u ON u.user_id = pm.user_id
       WHERE pm.project_id = $1`,
      [projectId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get members error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /api/projects/:projectId/members — add a member (owner only)
async function addMember(req, res) {
  const { projectId } = req.params;
  const { user_id, role } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const validRoles = ['owner', 'member', 'viewer'];
  const memberRole = role || 'member';

  if (!validRoles.includes(memberRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const requesterCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.user_id]
    );

    if (requesterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (requesterCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can add members' });
    }

    const userExists = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      return res.status(400).json({ error: 'No such user' });
    }

    const existingMember = await pool.query(
      `SELECT user_id FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, user_id]
    );
    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const result = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING project_id, user_id, role`,
      [projectId, user_id, memberRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add member error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// PATCH /api/projects/:projectId/members/:userId — change role (owner only)
async function updateMemberRole(req, res) {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  const validRoles = ['owner', 'member', 'viewer'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'A valid role is required' });
  }

  try {
    const requesterCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.user_id]
    );

    if (requesterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (requesterCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can change roles' });
    }

    const targetCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Prevent demoting the last remaining owner
    if (targetCheck.rows[0].role === 'owner' && role !== 'owner') {
      const ownerCount = await pool.query(
        `SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'owner'`,
        [projectId]
      );
      if (parseInt(ownerCount.rows[0].count, 10) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner of a project' });
      }
    }

    const result = await pool.query(
      `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3
       RETURNING project_id, user_id, role`,
      [role, projectId, userId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Update member role error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// DELETE /api/projects/:projectId/members/:userId — remove member (owner only)
async function removeMember(req, res) {
  const { projectId, userId } = req.params;

  try {
    const requesterCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.user_id]
    );

    if (requesterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (requesterCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can remove members' });
    }

    const targetCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (targetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (targetCheck.rows[0].role === 'owner') {
      const ownerCount = await pool.query(
        `SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'owner'`,
        [projectId]
      );
      if (parseInt(ownerCount.rows[0].count, 10) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner of a project' });
      }
    }

    await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Remove member error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { getMembers, addMember, updateMemberRole, removeMember };