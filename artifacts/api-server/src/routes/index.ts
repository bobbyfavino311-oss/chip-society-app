import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import socialRouter from "./social";
import bugsRouter from "./bugs";
import referralsRouter from "./referrals";
import avatarsRouter from "./avatars";
import suggestionsRouter from "./suggestions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(socialRouter);
router.use(bugsRouter);
router.use(referralsRouter);
router.use(avatarsRouter);
router.use(suggestionsRouter);

export default router;
