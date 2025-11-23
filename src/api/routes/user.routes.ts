import { Router } from "express";
import { checkUserSessionController, deleteSingleUserController, getSingleUserController, loginUserController, logoutUserController, registerUserController, resetPasswordController, updateUser2FAController, updateUserPreferencesController, updateUserProfileController } from "../controllers/user.controller";

const router = Router();

// register user route
router.post('/', registerUserController);

// login user route
router.post('/login', loginUserController);

// logout user route
router.post('/logout', logoutUserController);

// get single user route
router.get('/:userId', getSingleUserController);

// check user session route
router.get('/session/check', checkUserSessionController);

// user delete route
router.delete('/:userId', deleteSingleUserController);

// get single user route
router.get('/:userId', getSingleUserController);

// update user profile route
router.patch('/:userId/profile', updateUserProfileController);

// update user security route
router.patch('/:userId/preferences', updateUserPreferencesController);

// update user security route
router.patch('/:userId/security', updateUser2FAController);

// reset password route
router.patch('/:userId/reset-password', resetPasswordController);

export default router;
