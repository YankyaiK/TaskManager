const express = require('express');
const router = express.Router({ mergeParams: true });
const authenticateToken = require('../middleware/authMiddleware');
const {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
} = require('../controllers/memberController');

router.use(authenticateToken);

router.get('/', getMembers);
router.post('/', addMember);
router.patch('/:userId', updateMemberRole);
router.delete('/:userId', removeMember);

module.exports = router;