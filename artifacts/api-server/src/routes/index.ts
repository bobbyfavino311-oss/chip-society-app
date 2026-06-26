import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import socialRouter from "./social";
import bugsRouter from "./bugs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(socialRouter);
router.use(bugsRouter);

export default router;
