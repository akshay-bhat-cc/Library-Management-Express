import express from "express";
import { handleLogin } from "../controllers/authController";
import { handleLogout } from "../controllers/logoutController";
import { handleRefreshToken } from "../controllers/refreshTokenController";
import { handleNewMember } from "../controllers/registerController";
import { verifyJWT } from "../middlewares/verifyJWT";
import { getUserDetails } from "../controllers/getUserDetails";
import { deleteUser } from "../controllers/deleteUser";
import { updateUser } from "../controllers/updateUser";

const router = express.Router();

router.get("/", handleRefreshToken);
router.post("/register", handleNewMember);
router.post("/login", handleLogin);
router.get("/logout", handleLogout);
router.get("/:id", verifyJWT, getUserDetails);
router.patch("/:id", verifyJWT, updateUser);
router.delete("/:id", verifyJWT, deleteUser);

export default router;
