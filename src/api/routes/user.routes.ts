import { Router } from "express";
import { registerUserController } from "../controllers/user.controller";

const router = Router();

// register user route
router.post('/', registerUserController);

export default router;