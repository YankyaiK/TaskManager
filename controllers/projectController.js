const pool = require('../config/db');

// GET /api/projects — list projects the user is a member of
async function getProjects(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.project_id, p.name, p.status, p.created_at, pm.role
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.project_id
       WHERE pm.user_id = $1`,
      [req.user.user_id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get projects error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /api/projects — create a project
async function createProject(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const projectResult = await client.query(
      `INSERT INTO projects (name, project_owner_id)
       VALUES ($1, $2)
       RETURNING project_id, name, status, created_at`,
      [name, req.user.user_id]
    );

    const project = projectResult.rows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [project.project_id, req.user.user_id]
    );

    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create project error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  } finally {
    client.release();
  }
}

// GET /api/projects/:id — get one project (must be a member)
async function getProject(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.project_id, p.name, p.status, p.created_at
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.project_id
       WHERE p.project_id = $1 AND pm.user_id = $2`,
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get project error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// PATCH /api/projects/:id — update (owner only)
async function updateProject(req, res) {
  const { id } = req.params;
  const { name, status } = req.body;

  try {
    const memberCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (memberCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can update this project' });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           status = COALESCE($2, status)
       WHERE project_id = $3
       RETURNING project_id, name, status, created_at`,
      [name, status, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// DELETE /api/projects/:id — delete (owner only)
async function deleteProject(req, res) {
  const { id } = req.params;

  try {
    const memberCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (memberCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can delete this project' });
    }

    await pool.query('DELETE FROM projects WHERE project_id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete project error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };