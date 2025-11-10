import { Router } from "express";
import { checkUserSessionController, getSingleUserController, loginUserController, logoutUserController, registerUserController } from "../controllers/user.controller";

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

export default router;
