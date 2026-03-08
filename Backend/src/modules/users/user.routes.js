import { Router } from "express";
import { authGuard, requireRoles } from "../../middleware/auth.js";
import { listUsersController, updateUserController } from "./user.controller.js";

const router = Router();

router.use(authGuard);
router.use(requireRoles("admin"));

router.get("/", listUsersController);
router.patch("/:userId", updateUserController);

export default router;
