import { Router, type IRouter } from "express";
import healthRouter from "./health";
import energyRouter from "./energy";
import energyActionRouter from "./energy-action";
import challengeRouter from "./challenge";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/energy", energyRouter);
router.use("/energy", energyActionRouter);
router.use(challengeRouter);
router.use(eventsRouter);

export default router;
