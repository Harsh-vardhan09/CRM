import { Router } from 'express';
import { 
  login, refresh, logout, getMe, signUpCompany, signUpEmployee, 
  getJoinRequests, approveJoinRequest, rejectJoinRequest, getCompanyRoles 
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router: Router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

router.post('/signup/company', signUpCompany);   // For CEO / Owner Signup
router.post('/signup/employee', signUpEmployee); // For Sales Rep / Employee Signup

// Admin Join-Request Routes
router.get('/company/join-requests', protect, restrictTo('Admin'), getJoinRequests);
router.patch('/company/join-requests/approve', protect, restrictTo('Admin'), approveJoinRequest);
router.patch('/company/join-requests/reject', protect, restrictTo('Admin'), rejectJoinRequest);
router.get('/company/roles', protect, restrictTo('Admin'), getCompanyRoles);

export default router;
