import express from 'express';
import { googleLogin, login } from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/google", googleLogin);

export default authRouter;