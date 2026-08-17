const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

router.use(authenticateToken); // applies to every route below

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;